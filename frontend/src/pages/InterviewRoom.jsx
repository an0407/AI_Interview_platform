import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
  const [maxQuestions, setMaxQuestions] = useState(10); // Dynamic question limit
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [audioURL, setAudioURL] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState('idle'); // 'idle' | 'listening' | 'recording' | 'submitted'

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const audioRef = useRef(null);

  // Helper function to cleanup audio before playing new audio
  const cleanupAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.onended = null;
      audioRef.current = null;
    }
  };

  useEffect(() => {
    fetchInterview();
    return () => {
      // Cleanup audio and stream when component unmounts
      cleanupAudio();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [interviewId]);

  const fetchInterview = async () => {
    setLoading(true);
    console.log('Fetching interview with ID:', interviewId);
    try {
      const url = `http://192.168.1.10:8000/interviews/${interviewId}`;
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

      const response = await fetch('http://192.168.1.10:8000/interview/attend', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to get first question');

      const data = await response.json();
      console.log('Question received:', data);
      setCurrentQuestion(data.ai_question);
      setQuestionCount(1);
      setAudioURL(''); // Clear previous recording
      setRecordingStatus('idle');

      // Auto-play audio and setup auto-start recording
      if (data.audio_path) {
        try {
          // Stop any existing audio before playing new one
          cleanupAudio();

          const audioUrl = `http://192.168.1.10:8000${data.audio_path}`;
          const audio = new Audio(audioUrl);
          audioRef.current = audio;

          // Auto-start recording when audio ends
          audio.onended = async () => {
            console.log('Question audio finished, starting recording...');
            setRecordingStatus('recording');
            await startRecording();
          };

          // Set status to listening
          setRecordingStatus('listening');

          // Auto-play audio
          audio.play().catch(err => {
            console.error('Could not auto-play audio:', err);
            alert('Audio failed to play. Please check your connection. Click OK to continue manually.');
            setRecordingStatus('idle');
          });
        } catch (err) {
          console.error('Audio playback error:', err);
          alert('Failed to load question audio. Please try again.');
          setRecordingStatus('idle');
        }
      }
    } catch (err) {
      setError('Failed to get interview question');
      console.error(err);
    }
  };

  const getNextQuestion = async () => {
    try {
      setIsSubmitting(true);
      setRecordingStatus('submitted');

      const formData = new FormData();
      formData.append('user_id', user._id);
      formData.append('interview_id', interviewId);

      // Get the recorded audio blob
      if (mediaRecorderRef.current && audioChunksRef.current.length > 0) {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        formData.append('audio', audioBlob, 'answer.wav');
      }

      const response = await fetch('http://192.168.1.10:8000/interview/attend', {
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
        // Auto-end the interview after the last answer is submitted
        setQuestionCount(newQuestionCount);
        setIsSubmitting(false);
        setRecordingStatus('idle');
        setTimeout(() => {
          handleEndInterview();
        }, 1000);
        return;
      }

      // Update question and increment counter
      setCurrentQuestion(data.ai_question);
      setQuestionCount(newQuestionCount);
      setAudioURL(''); // Clear previous recording
      audioChunksRef.current = []; // Clear audio chunks for next recording

      // Auto-play next question audio
      if (data.audio_path) {
        try {
          // Stop any existing audio before playing new one
          cleanupAudio();

          const audioUrl = `http://192.168.1.10:8000${data.audio_path}`;
          const audio = new Audio(audioUrl);
          audioRef.current = audio;

          audio.onended = async () => {
            console.log('Question audio finished, starting recording...');
            setRecordingStatus('recording');
            await startRecording();
          };

          setRecordingStatus('listening');
          audio.play().catch(err => {
            console.error('Could not auto-play audio:', err);
            alert('Audio failed to play. Please check your connection. Click OK to continue manually.');
            setRecordingStatus('idle');
          });
        } catch (err) {
          console.error('Audio playback error:', err);
          alert('Failed to load question audio. Please try again.');
          setRecordingStatus('idle');
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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);

        // Stop the stream
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      setError('Failed to access microphone: ' + err.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleEndInterview = async () => {
    const confirmed = window.confirm('Are you sure you want to end the interview? This will start the evaluation process.');
    if (!confirmed) return;

    setIsEvaluating(true);
    try {
      // Update status to completed
      const statusResponse = await fetch(
        `http://192.168.1.10:8000/interviews/${interviewId}/status`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'completed', user_id: user._id }),
        }
      );

      if (!statusResponse.ok) throw new Error('Failed to update status');

      // Evaluate interview
      const evalResponse = await fetch(
        `http://192.168.1.10:8000/interview-eval/evaluate/${interviewId}`
      );

      if (evalResponse.ok) {
        navigate(`/results/${interviewId}`);
      } else {
        throw new Error('Evaluation failed');
      }
    } catch (err) {
      setError('Failed to end interview: ' + err.message);
      setIsEvaluating(false);
    }
  };

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
        <h1>🎙️ Interview Session</h1>
        <div className="progress-indicator">
          Question {questionCount} of {maxQuestions}
        </div>
      </div>

      {isEvaluating && (
        <div className="evaluating-overlay">
          <LoadingSpinner message="🔄 Evaluating your interview... Please wait" />
        </div>
      )}

      <div className="room-content">
        <div className="question-section">
          <h2>Current Question:</h2>
          <div className="question-box">
            <p>{currentQuestion || 'Loading question...'}</p>
          </div>
        </div>

        <div className="recording-section">
          <h3>Your Response:</h3>

          {/* Status Indicator */}
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

          <div className="recording-controls">
            <button
              className={`record-btn ${isRecording ? 'recording' : ''}`}
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isEvaluating || recordingStatus === 'submitted' || recordingStatus === 'listening'}
            >
              {isRecording ? '⏹️ Stop Recording' : '🎤 Start Recording'}
            </button>
          </div>

          {audioURL && (
            <div className="audio-playback">
              <p>Recording saved:</p>
              <audio controls src={audioURL} />
            </div>
          )}

          {/* Submit Answer Button - Only show when recording is done */}
          {audioURL && !isSubmitting && recordingStatus !== 'listening' && (
            <button
              className="submit-answer-btn"
              onClick={getNextQuestion}
              disabled={isEvaluating || isSubmitting}
            >
              {questionCount === maxQuestions ? '✓ End Interview' : '→ Next Question'}
            </button>
          )}

          {isSubmitting && (
            <button className="submit-answer-btn loading" disabled>
              ⏳ Processing...
            </button>
          )}
        </div>

        <div className="action-buttons">
          <button
            className="end-interview-btn"
            onClick={handleEndInterview}
            disabled={isEvaluating}
          >
            {isEvaluating ? '⏳ Processing...' : '✓ End Interview'}
          </button>
          <button
            className="back-btn"
            onClick={() => navigate('/dashboard')}
            disabled={isEvaluating}
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default InterviewRoom;
