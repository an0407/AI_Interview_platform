import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import './EvaluationResults.css';

const EvaluationResults = () => {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchResults();
  }, [interviewId]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://192.168.5.99:8000/interview-eval/evaluate/${interviewId}`
      );

      if (!response.ok) throw new Error('Failed to fetch results');

      const data = await response.json();
      console.log('Evaluation results data:', data);

      // Check evaluation status
      if (data.status === 'in_progress') {
        setError('Evaluation is currently in progress. Please wait a few moments and refresh the page.');
        setResults(null);
      } else if (data.status === 'failed') {
        setError(`Evaluation failed: ${data.message || data.error || 'Unknown error'}`);
        setResults(null);
      } else if (data.interview_result) {
        // Evaluation completed successfully
        setResults(data);
        setError('');
      } else {
        setError('Evaluation results are not yet available. Please try again later.');
        setResults(null);
      }
    } catch (err) {
      setError('Failed to load evaluation results: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading evaluation results..." />;

  if (error) {
    return (
      <div className="results-container">
        <div className="error-section">
          <h1>❌ Error Loading Results</h1>
          <p>{error}</p>
          <button onClick={() => navigate('/dashboard')} className="back-to-dashboard">
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!results || !results.interview_result) {
    return (
      <div className="results-container">
        <div className="error-section">
          <h1>📋 No Results Available</h1>
          <p>Evaluation results are not yet available. Please try again later.</p>
          <button onClick={() => navigate('/dashboard')} className="back-to-dashboard">
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const { interview_result } = results;
  const aggregatedScores = interview_result.aggregated_scores || {};
  const technicalScores = interview_result.technical_scores || {};
  const audioResults = interview_result.audio_results || {};

  // Get overall score directly from backend (already calculated and scaled 0-100)
  const overallScore = Math.round(aggregatedScores.overall_score || 0);

  return (
    <div className="results-container">
      <div className="results-header">
        <h1>📊 Interview Evaluation Results</h1>
        <div className="score-card">
          <div className="overall-score">
            <h2>{overallScore}%</h2>
            <p>Overall Score</p>
          </div>
          <div className="score-interpretation">
            {overallScore >= 80 && <p className="excellent">Excellent Performance!</p>}
            {overallScore >= 60 && overallScore < 80 && <p className="good">Good Performance</p>}
            {overallScore >= 40 && overallScore < 60 && <p className="average">Average Performance</p>}
            {overallScore < 40 && <p className="needs-improvement">Needs Improvement</p>}
          </div>
        </div>
      </div>

      <div className="results-content">
        <div className="section">
          <h2>📝 Technical Assessment</h2>
          <div className="scores-list">
            {Object.entries(technicalScores).length > 0 ? (
              Object.entries(technicalScores).map(([question, score]) => {
                // Calculate overall score from the 4 metrics (1-10 scale)
                const questionScore = Math.round(
                  ((score?.technical_score || 0) +
                    (score?.depth_score || 0) +
                    (score?.clarity_score || 0) +
                    (score?.practical_score || 0)) / 4 * 10
                );
                return (
                  <div key={question} className="score-item">
                    <div className="score-label">Question {question}</div>
                    <div className="score-bar-container">
                      <div
                        className="score-bar"
                        style={{
                          width: `${Math.min(100, questionScore)}%`,
                        }}
                      />
                    </div>
                    <div className="score-value">
                      {questionScore}/100
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="no-data">No technical scores available</p>
            )}
          </div>
        </div>

        <div className="section">
          <h2>🎙️ Audio Analysis</h2>
          <div className="audio-analysis">
            {Object.entries(audioResults).length > 0 ? (
              Object.entries(audioResults).map(([question, analysis]) => (
                <div key={question} className="audio-item">
                  <h3>Question {question}</h3>
                  <p><strong>Confidence Score:</strong> {analysis?.confidence_score !== undefined ? Math.round(analysis.confidence_score * 10) / 10 : 'N/A'}</p>
                  <p><strong>Speech Rate:</strong> {analysis?.speech_rate !== undefined ? `${Math.round(analysis.speech_rate)} BPM` : 'N/A'}</p>
                  <p><strong>Status:</strong> {analysis?.status || 'N/A'}</p>
                </div>
              ))
            ) : (
              <p className="no-data">No audio analysis available</p>
            )}
          </div>
        </div>

        <div className="section">
          <h2>🎯 Criteria Scores</h2>
          <div className="aggregated-scores">
            {aggregatedScores.criteria_scores && Object.entries(aggregatedScores.criteria_scores).length > 0 ? (
              Object.entries(aggregatedScores.criteria_scores).map(([metric, score]) => (
                <div key={metric} className="metric-card">
                  <h3>{metric.replace(/_/g, ' ').toUpperCase()}</h3>
                  <p className="metric-score">{Math.round(score)}/100</p>
                </div>
              ))
            ) : (
              <p className="no-data">No criteria scores available</p>
            )}
          </div>
        </div>

        <div className="section">
          <h2>💡 Detailed Feedback</h2>

          {/* Overall Summary */}
          {aggregatedScores.combined_feedback && (
            <div className="feedback-card">
              <h3>Overall Assessment</h3>
              <p>{aggregatedScores.combined_feedback}</p>
            </div>
          )}

          {/* Strengths */}
          {aggregatedScores.strengths && (
            <div className="feedback-card strengths">
              <h3>✨ Key Strengths</h3>
              <p>{aggregatedScores.strengths}</p>
            </div>
          )}

          {/* Areas for Improvement */}
          {aggregatedScores.improvement_areas && (
            <div className="feedback-card improvements">
              <h3>📈 Areas for Improvement</h3>
              <p>{aggregatedScores.improvement_areas}</p>
            </div>
          )}

          {/* Per-Question Details */}
          {Object.entries(technicalScores).length > 0 && (
            <div className="question-details">
              <h3>📋 Question-by-Question Breakdown</h3>
              {Object.entries(technicalScores).map(([question, score]) => (
                <div key={question} className="question-detail-card">
                  <h4>Question {question}</h4>

                  <div className="metrics-grid">
                    <div className="metric">
                      <span>Technical Correctness:</span>
                      <span className="score-badge">{score.technical_score || 0}/10</span>
                    </div>
                    <div className="metric">
                      <span>Depth of Knowledge:</span>
                      <span className="score-badge">{score.depth_score || 0}/10</span>
                    </div>
                    <div className="metric">
                      <span>Clarity:</span>
                      <span className="score-badge">{score.clarity_score || 0}/10</span>
                    </div>
                    <div className="metric">
                      <span>Practical Understanding:</span>
                      <span className="score-badge">{score.practical_score || 0}/10</span>
                    </div>
                  </div>

                  {score.feedback && (
                    <div className="feedback-text">
                      <strong>Feedback:</strong>
                      <p>{score.feedback}</p>
                    </div>
                  )}

                  {score.strengths && score.strengths.length > 0 && (
                    <div className="strengths-list">
                      <strong>Strengths:</strong>
                      <ul>
                        {score.strengths.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                  )}

                  {score.improvements && score.improvements.length > 0 && (
                    <div className="improvements-list">
                      <strong>Areas for Improvement:</strong>
                      <ul>
                        {score.improvements.map((imp, i) => <li key={i}>{imp}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="results-footer">
        <button
          onClick={() => window.print()}
          className="download-btn"
        >
          🖨️ Print Report
        </button>
        <button
          onClick={() => navigate('/dashboard')}
          className="back-to-dashboard"
        >
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default EvaluationResults;
