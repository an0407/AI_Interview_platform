import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SilenceDetector from '../utils/silenceDetector';
import LoadingSpinner from '../components/LoadingSpinner';
import './InterviewRoom.css';

const InterviewRoom = () => {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [maxQuestions, setMaxQuestions] = useState(10);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [audioURL, setAudioURL] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState('idle'); // 'idle' | 'listening' | 'recording' | 'submitted'
  const [isQuestionPlaying, setIsQuestionPlaying] = useState(false);

  // Silence detection state
  const [silenceDuration, setSilenceDuration] = useState(0);
  const [isSilenceDetectionActive, setIsSilenceDetectionActive] = useState(false);
  const silenceDetectorRef = useRef(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const audioRef = useRef(null);
  const videoRef = useRef(null);
  const mimeTypeRef = useRef('audio/webm');
  const firstQuestionFetchedRef = useRef(false); // Prevent React Strict Mode from fetching multiple times

  // Helper function to cleanup audio before playing new audio
  const cleanupAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.onended = null;
      audioRef.current = null;
    }
  };

  // Cleanup function
  const cleanup = () => {
    cleanupAudio();

    // Stop silence detection
    if (silenceDetectorRef.current) {
      silenceDetectorRef.current.stop();
      silenceDetectorRef.current = null;
    }

    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    // Only fetch the interview once to prevent React Strict Mode from creating duplicate questions
    if (!firstQuestionFetchedRef.current && interviewId && user) {
      firstQuestionFetchedRef.current = true;
      fetchInterview();
    }
    return cleanup;
  }, [interviewId, user]);

  const fetchInterview = async () => {
    setLoading(true);
    console.log('Fetching interview with ID:', interviewId);
    try {
      const url = `http://192.168.5.99:8000/interviews/${interviewId}`;
      console.log('Calling URL:', url);
      const response = await fetch(url);
      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw new Error('Interview not found');
      }

      const data = await response.json();
      console.log('Interview data received:', data);
      setInterview(data);

      // Extract expected question count from notes
      const notes = data.interview_instructions?.notes || '';
      const match = notes.match(/(\d+)\s*(?:questions?|q)/i);
      if (match) {
        const extractedCount = parseInt(match[1], 10);
        setMaxQuestions(extractedCount);
        console.log(`Found custom question count in notes: ${extractedCount}`);
      }

      getFirstQuestion(data);
    } catch (err) {
      setError('Failed to load interview');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getFirstQuestion = async (interviewData) => {
    try {
      const formData = new FormData();
      formData.append('user_id', user._id);
      formData.append('interview_id', interviewId);

      const response = await fetch('http://192.168.5.99:8000/interview/attend', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to get first question');

      const data = await response.json();
      console.log('Question received:', data);
      setCurrentQuestion(data.ai_question);
      setQuestionCount(1);
      setAudioURL('');
      setRecordingStatus('idle');

      // Auto-play audio and setup auto-start recording
      if (data.audio_path) {
        try {
          cleanupAudio();

          const audioUrl = `http://192.168.5.99:8000${data.audio_path}`;
          const audio = new Audio(audioUrl);
          audioRef.current = audio;

          // Initialize camera in parallel while audio is loading (non-blocking)
          initializeCamera().catch(err => {
            console.warn('Camera initialization failed, but continuing with interview:', err);
          });

          // Auto-start recording when audio ends
          audio.onended = async () => {
            console.log('Question audio finished, starting recording with silence detection...');
            setIsQuestionPlaying(false);
            setRecordingStatus('recording');
            // Clear audioRef to prevent retry logic from replaying completed audio
            audioRef.current = null;
            await startRecording();
          };

          setRecordingStatus('listening');
          setIsQuestionPlaying(true);

          audio.play().catch(err => {
            console.warn('Auto-play blocked by browser. Audio will play after user interaction.', err);
            // Don't show alert - just wait for user interaction
            setRecordingStatus('idle');
            setIsQuestionPlaying(false);

            // Browser blocked auto-play - don't add global click handler (causes interference with buttons)
            // User will click "Manual Record" button which will trigger audio playback
            console.log('Browser blocked auto-play. Please click a button on the page to activate audio.');
          });
        } catch (err) {
          console.error('Audio playback error:', err);
          setError('Failed to load question audio. Please refresh the page.');
          setRecordingStatus('idle');
          setIsQuestionPlaying(false);
        }
      }
    } catch (err) {
      setError('Failed to get interview question');
      console.error(err);
    }
  };

  const getNextQuestion = async (silenceSkip = false) => {
    try {
      setIsSubmitting(true);
      setRecordingStatus('submitted');

      // Stop silence detection if active
      if (silenceDetectorRef.current) {
        silenceDetectorRef.current.stop();
        silenceDetectorRef.current = null;
      }
      setIsSilenceDetectionActive(false);
      setSilenceDuration(0);

      const formData = new FormData();
      formData.append('user_id', user._id);
      formData.append('interview_id', interviewId);
      formData.append('silence_skip', silenceSkip ? 'true' : 'false');

      // Determine if we have valid audio blob (vs fallback values)
      const hasValidAudioBlob = audioURL && audioURL.startsWith('blob:');
      const fallbackAudioValues = ['no-audio', 'no-audio-recorded', 'empty', 'error', 'fallback-error', 'stop-error'];
      const hasNoAudio = fallbackAudioValues.includes(audioURL);

      // Get the recorded audio blob (only if not silence skip and audio was recorded)
      if (!silenceSkip && hasValidAudioBlob && mediaRecorderRef.current && audioChunksRef.current.length > 0) {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeTypeRef.current });
        // Determine file extension based on mimeType
        const extension = mimeTypeRef.current.includes('webm') ? 'webm' : 'wav';
        formData.append('audio', audioBlob, `answer.${extension}`);
        console.log('Audio blob attached to request');
      } else if (hasNoAudio) {
        console.log('No valid audio blob - marking as silence skip');
        // Mark as silence skip since no audio was recorded
        formData.set('silence_skip', 'true');
      } else if (!silenceSkip && !hasValidAudioBlob && audioChunksRef.current.length > 0) {
        // Fallback: Try to use chunks even if audioURL is not a blob URL
        console.warn('audioURL is not a blob URL but chunks exist, attempting to use chunks');
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeTypeRef.current });
        const extension = mimeTypeRef.current.includes('webm') ? 'webm' : 'wav';
        formData.append('audio', audioBlob, `answer.${extension}`);
      } else {
        console.log('No audio to submit - continuing as silence skip');
        formData.set('silence_skip', 'true');
      }

      const response = await fetch('http://192.168.5.99:8000/interview/attend', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to submit answer');

      const data = await response.json();
      console.log('Next question received:', data);

      // Check if we've reached the max questions
      const newQuestionCount = questionCount + 1;
      if (newQuestionCount >= maxQuestions) {
        console.log(`Max questions (${maxQuestions}) reached. Ending interview.`);
        setQuestionCount(newQuestionCount);
        setIsSubmitting(false);
        setRecordingStatus('idle');
        setTimeout(() => {
          handleEndInterview();
        }, 1000);
        return;
      }

      // Update question and increment counter
      console.log('Updating state with new question:');
      console.log('  Old question:', currentQuestion);
      console.log('  New question:', data.ai_question);
      console.log('  Old count:', questionCount, 'New count:', newQuestionCount);

      setCurrentQuestion(data.ai_question);
      setQuestionCount(newQuestionCount);
      setAudioURL('');
      audioChunksRef.current = [];

      console.log('State updates queued for question:', data.ai_question.substring(0, 50));

      // Auto-play next question audio
      if (data.audio_path) {
        try {
          cleanupAudio();

          const audioUrl = `http://192.168.5.99:8000${data.audio_path}`;
          const audio = new Audio(audioUrl);
          audioRef.current = audio;

          audio.onended = async () => {
            console.log('Question audio finished, starting recording with silence detection...');
            setIsQuestionPlaying(false);
            setRecordingStatus('recording');
            // Clear audioRef to prevent retry logic from replaying completed audio
            audioRef.current = null;
            await startRecording();
          };

          setRecordingStatus('listening');
          setIsQuestionPlaying(true);
          audio.play().catch(err => {
            console.warn('Auto-play blocked by browser. Audio will play after user interaction.', err);
            // Don't show alert - just wait for user interaction
            setRecordingStatus('idle');
            setIsQuestionPlaying(false);

            // Browser blocked auto-play - don't add global click handler (causes interference with buttons)
            // User will click "Manual Record" button which will trigger audio playback
            console.log('Browser blocked auto-play. Please click a button on the page to activate audio.');
          });
        } catch (err) {
          console.error('Audio playback error:', err);
          setError('Failed to load question audio. Please refresh the page.');
          setRecordingStatus('idle');
          setIsQuestionPlaying(false);
        }
      }
    } catch (err) {
      setError('Failed to get next question: ' + err.message);
      setRecordingStatus('idle');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const initializeCamera = async () => {
    try {
      console.log('Initializing camera and microphone...');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true
      });

      streamRef.current = stream;

      // Display video
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        console.log('Video stream connected to video element');
      }

      console.log('Camera initialized successfully');
      return stream;
    } catch (error) {
      console.warn('Failed to access camera/microphone:', error);

      // Try audio-only if camera/video failed
      try {
        console.log('Attempting audio-only mode...');
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false
        });

        streamRef.current = audioStream;
        console.log('Audio-only mode initialized successfully');
        return audioStream;
      } catch (audioError) {
        console.error('Failed to access audio:', audioError);
        console.warn('Continuing interview without media devices');
        // Return null to continue without audio/video
        return null;
      }
    }
  };

  const startRecording = async () => {
    try {
      // If question audio is waiting to be played (browser blocked auto-play), try to play it now
      if (audioRef.current && !isQuestionPlaying) {
        try {
          audioRef.current.play().then(() => {
            console.log('Question audio resumed after user button click');
            setRecordingStatus('listening');
            setIsQuestionPlaying(true);
          }).catch(e => console.warn('Audio still blocked:', e));
        } catch (e) {
          console.warn('Failed to resume audio:', e);
        }
      }

      // Use existing stream or initialize if not available
      let stream = streamRef.current;
      if (!stream) {
        console.log('Stream not found, initializing camera...');
        stream = await initializeCamera();
      }

      // If no stream available (no camera/mic), skip recording but allow interview to continue
      if (!stream) {
        console.warn('No media stream available. Interview will continue without recording.');
        setIsRecording(false);
        setRecordingStatus('idle');
        // Set a dummy audioURL to show submit button
        setAudioURL('no-audio');
        return;
      }

      console.log('Starting recording with existing stream...');

      // Create MediaRecorder from existing stream
      const mediaRecorder = new MediaRecorder(stream);
      mimeTypeRef.current = mediaRecorder.mimeType || 'audio/webm';
      console.log('MediaRecorder mimeType:', mimeTypeRef.current);

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          console.log('Audio chunk received:', event.data.size, 'bytes');
        }
      };

      mediaRecorder.onstop = () => {
        try {
          console.log('MediaRecorder stopped, total chunks:', audioChunksRef.current.length);

          // Create audio blob and URL to enable submit button
          if (audioChunksRef.current.length > 0) {
            const audioBlob = new Blob(audioChunksRef.current, { type: mimeTypeRef.current });
            const url = URL.createObjectURL(audioBlob);
            console.log('Audio blob created successfully, URL:', url);
            setAudioURL(url);
          } else {
            console.warn('No audio chunks available after recording stopped');
            // If no chunks, mark as recorded but empty (might happen with failed audio capture)
            setAudioURL('empty');
          }
        } catch (error) {
          console.error('Error in mediaRecorder.onstop:', error);
          setAudioURL('error');
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      console.log('Recording started');

      // Start silence detection after 5-second grace period
      // This gives users time to process the question and start formulating their answer
      setTimeout(() => {
        if (isRecording && streamRef.current) {
          console.log('Starting silence detection after grace period...');
          startSilenceDetection(stream);
        }
      }, 5000); // 5-second grace period
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Failed to start recording: ' + error.message);
    }
  };

  const startSilenceDetection = (stream) => {
    try {
      // Get audio track from stream
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        console.warn('No audio track available for silence detection');
        return;
      }

      const audioTrack = audioTracks[0];

      // Create silence detector with MediaStream compatibility
      silenceDetectorRef.current = new SilenceDetector(
        { mediaStreamTrack: audioTrack }, // Wrap in object for compatibility
        {
          silenceThreshold: 10000, // 10 seconds
          volumeThreshold: -50, // dB
          onSilenceDetected: handleSilenceDetected,
          onSilenceProgress: handleSilenceProgress,
          onAudioDetected: handleAudioDetected,
        }
      );

      silenceDetectorRef.current.start();
      setIsSilenceDetectionActive(true);
      console.log('Silence detection started');
    } catch (err) {
      console.error('Failed to start silence detection:', err);
    }
  };

  const handleSilenceDetected = async (duration) => {
    console.log(`Silence detected for ${duration}ms - auto-skipping question`);

    // Only auto-skip if recording is still active
    // Don't auto-skip if user already manually stopped recording
    if (!isRecording) {
      console.log('Recording already stopped manually, skipping auto-skip');
      setIsSilenceDetectionActive(false);
      setSilenceDuration(0);
      if (silenceDetectorRef.current) {
        silenceDetectorRef.current.stop();
        silenceDetectorRef.current = null;
      }
      return;
    }

    console.log('Initiating silence-based auto-skip...');
    setIsSilenceDetectionActive(false);
    setSilenceDuration(0);

    // Stop silence detection completely
    if (silenceDetectorRef.current) {
      silenceDetectorRef.current.stop();
      silenceDetectorRef.current = null;
    }

    // Stop recording
    if (mediaRecorderRef.current) {
      try {
        if (mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
      } catch (error) {
        console.error('Error stopping recorder:', error);
        setIsRecording(false);
      }
    }

    // Auto-skip to next question with empathetic message
    console.log('Calling getNextQuestion with silence_skip = true');
    await getNextQuestion(true); // true = silence_skip
  };

  const handleSilenceProgress = (duration, threshold) => {
    setSilenceDuration(duration);
  };

  const handleAudioDetected = () => {
    setSilenceDuration(0);
  };

  const stopRecording = () => {
    try {
      console.log('stopRecording called, current audioURL:', audioURL);

      // First, completely disable silence detection to prevent auto-skip
      if (silenceDetectorRef.current) {
        try {
          silenceDetectorRef.current.stop();
          silenceDetectorRef.current = null;
          console.log('Silence detection stopped');
        } catch (err) {
          console.error('Error stopping silence detector:', err);
          silenceDetectorRef.current = null;
        }
      }
      setIsSilenceDetectionActive(false);
      setSilenceDuration(0);

      // Stop the recorder
      if (mediaRecorderRef.current) {
        try {
          if (mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
            console.log('MediaRecorder.stop() called');
          }
        } catch (error) {
          console.error('Error stopping media recorder:', error);
        }
        setIsRecording(false);
        setRecordingStatus('idle'); // Reset status so submit button can appear
      }

      // Fallback: Ensure audioURL is set if onstop callback hasn't fired yet
      // Use a ref callback to avoid closure issues with state
      const checkAndSetAudioURL = () => {
        // Only set if audioURL still hasn't been set by the onstop callback
        // We check audioChunksRef to avoid closure issues with audioURL state
        if (audioChunksRef.current.length > 0) {
          try {
            const audioBlob = new Blob(audioChunksRef.current, { type: mimeTypeRef.current });
            const url = URL.createObjectURL(audioBlob);
            // Check if audioURL is still empty before setting (onstop may have already set it)
            setAudioURL(prevURL => {
              if (!prevURL || prevURL === '') {
                console.log('Fallback: Setting audioURL from chunks');
                return url;
              }
              // If already set, don't override
              console.log('Fallback: audioURL already set by onstop callback');
              return prevURL;
            });
          } catch (error) {
            console.error('Fallback: Error creating audio blob:', error);
          }
        }
      };
      setTimeout(checkAndSetAudioURL, 300);

      // Keep video running for next question
    } catch (error) {
      console.error('Error in stopRecording:', error);
      // Even on error, try to allow submission
      setAudioURL('stop-error');
    }
  };

  const handleEndInterview = async () => {
    const confirmed = window.confirm('Are you sure you want to end the interview? This will start the evaluation process.');
    if (!confirmed) return;

    setIsEvaluating(true);
    cleanup(); // Cleanup media resources

    try {
      // Update status to completed
      const statusResponse = await fetch(
        `http://192.168.5.99:8000/interviews/${interviewId}/status`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'completed', user_id: user._id }),
        }
      );

      if (!statusResponse.ok) throw new Error('Failed to update status');

      // Evaluate interview
      const evalResponse = await fetch(
        `http://192.168.5.99:8000/interview-eval/evaluate/${interviewId}`
      );

      if (!evalResponse.ok) {
        throw new Error('Evaluation failed');
      }

      const evalData = await evalResponse.json();
      console.log('Evaluation response:', evalData);

      // Check if evaluation was successful
      if (evalData.status === 'completed' || evalData.interview_result) {
        // Evaluation completed successfully
        navigate(`/results/${interviewId}`);
      } else if (evalData.status === 'in_progress') {
        // Evaluation is still in progress, show message
        alert('Evaluation is in progress. Please wait a moment and check your dashboard.');
        navigate('/dashboard');
      } else if (evalData.status === 'failed') {
        throw new Error(`Evaluation failed: ${evalData.message || evalData.error}`);
      } else {
        // Unknown status, try navigating to results anyway
        navigate(`/results/${interviewId}`);
      }
    } catch (err) {
      setError('Failed to end interview: ' + err.message);
      setIsEvaluating(false);
    }
  };

  // Calculate silence percentage for progress bar
  const silencePercent = Math.min((silenceDuration / 10000) * 100, 100);
  const showSilenceWarning = silenceDuration > 7000; // Warning at 7 seconds

  if (loading) return <LoadingSpinner message="Loading interview..." />;
  if (error) return (
    <div className="interview-room">
      <div className="error-container">
        <p className="error-message">{error}</p>
        <button onClick={() => navigate('/dashboard')} className="back-btn">
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );

  return (
    <div className="interview-room">
      <div className="room-header">
        <h1>🎙️ Video Interview Session</h1>
        <div className="progress-indicator">
          Question {questionCount} of {maxQuestions}
        </div>
      </div>

      {isEvaluating && (
        <div className="evaluating-overlay">
          <LoadingSpinner message="🔄 Evaluating your interview... Please wait" />
        </div>
      )}

      <div className="video-grid">
        {/* AI Participant Section */}
        <div className="ai-section">
          <div className="ai-header">
            <h3>AI Interviewer</h3>
          </div>
          <div className={`ai-avatar-container ${isQuestionPlaying ? 'speaking' : ''}`}>
            <div className="ai-avatar">
              <div className="ai-icon">🤖</div>
              {isQuestionPlaying && (
                <div className="sound-wave">
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              )}
            </div>
            <div className="ai-status">
              {isQuestionPlaying ? 'Speaking...' : 'Listening...'}
            </div>
          </div>
          <div className="question-display" key={`question-${questionCount}`}>
            <h4>Current Question:</h4>
            <p className="question-text">{currentQuestion || 'Loading question...'}</p>
          </div>
        </div>

        {/* Candidate Video Section */}
        <div className="candidate-section">
          <div className="candidate-header">
            <h3>Your Video</h3>
            {isRecording && <span className="recording-badge">● REC</span>}
          </div>
          <div className="video-container">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="candidate-video"
            />
            {!streamRef.current && (
              <div className="video-placeholder">
                <p>Camera will activate when recording starts</p>
              </div>
            )}
          </div>

          {/* Silence Timer */}
          {isSilenceDetectionActive && silenceDuration > 0 && (
            <div className={`silence-timer ${showSilenceWarning ? 'warning' : ''}`}>
              <div className="silence-info">
                <span>Silence: {Math.floor(silenceDuration / 1000)}s / 10s</span>
                {showSilenceWarning && (
                  <span className="warning-text">Question will auto-skip soon...</span>
                )}
              </div>
              <div className="silence-progress-bar">
                <div
                  className="silence-progress-fill"
                  style={{ width: `${silencePercent}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Recording Status */}
          <div className="status-indicator">
            {recordingStatus === 'listening' && (
              <p className="status-message">🎧 Listening to question...</p>
            )}
            {recordingStatus === 'recording' && (
              <p className="status-message recording">🎤 Recording your answer...</p>
            )}
            {recordingStatus === 'submitted' && (
              <p className="status-message submitted">⏳ Processing your answer...</p>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="interview-controls">
        <button
          className={`btn-record ${isRecording ? 'recording' : ''}`}
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isEvaluating || recordingStatus === 'submitted' || recordingStatus === 'listening'}
        >
          {isRecording ? '⏹️ Stop Recording' : '🎤 Manual Record'}
        </button>

        {audioURL && audioURL !== '' && !isSubmitting && recordingStatus !== 'listening' && (
          <button
            className="btn-submit"
            onClick={() => getNextQuestion(false)}
            disabled={isEvaluating || isSubmitting}
            title={audioURL.startsWith('blob:') ? 'Submit your recorded answer' : 'Submit (no audio was recorded)'}
          >
            {questionCount === maxQuestions ? '✓ Submit & End' : '→ Submit Answer'}
          </button>
        )}

        <button
          className="btn-end"
          onClick={handleEndInterview}
          disabled={isEvaluating}
        >
          {isEvaluating ? '⏳ Processing...' : '✓ End Interview'}
        </button>
      </div>
    </div>
  );
};

export default InterviewRoom;
