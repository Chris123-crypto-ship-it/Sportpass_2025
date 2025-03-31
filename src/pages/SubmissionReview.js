import React, { useState, useEffect } from 'react';
import { FaFile, FaDownload } from 'react-icons/fa';

// Komponente zum Anzeigen der Anhänge
const SubmissionAttachments = ({ submissionId }) => {
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAttachments = async () => {
      try {
        const response = await fetch(`${API_URL}/submission-attachments/${submissionId}`, {
          headers: getHeaders()
        });
        
        if (!response.ok) {
          throw new Error(`Server-Fehler: ${response.status}`);
        }
        
        const data = await response.json();
        setAttachments(data.attachments || []);
      } catch (error) {
        console.error("Fehler beim Laden der Anhänge:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAttachments();
  }, [submissionId]);
  
  if (loading) return <div>Lade Anhänge...</div>;
  if (error) return <div>Fehler: {error}</div>;
  
  if (attachments.length === 0) {
    return <div>Keine Anhänge vorhanden</div>;
  }
  
  return (
    <div className="submission-attachments">
      <h3>Anhänge</h3>
      <div className="attachments-grid">
        {attachments.map(attachment => {
          const isImage = attachment.file_type.startsWith('image/');
          const isVideo = attachment.file_type.startsWith('video/');
          
          return (
            <div key={attachment.id} className="attachment-item">
              <div className="attachment-preview">
                {isImage && (
                  <img src={API_URL + attachment.file_url} alt={attachment.file_name} />
                )}
                {isVideo && (
                  <video controls>
                    <source src={API_URL + attachment.file_url} type={attachment.file_type} />
                    Dein Browser unterstützt das Video-Format nicht.
                  </video>
                )}
                {!isImage && !isVideo && (
                  <div className="file-placeholder">
                    <FaFile size={40} />
                  </div>
                )}
              </div>
              <div className="attachment-info">
                <span className="attachment-name">{attachment.file_name}</span>
                <a 
                  href={API_URL + attachment.file_url} 
                  download={attachment.file_name}
                  className="download-link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaDownload /> Herunterladen
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SubmissionAttachments; 