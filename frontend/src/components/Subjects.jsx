import React from 'react';
import { data } from './data';
import './Subjects.css'; 

const Subjects = ({ user, onLogout, cycle, type, onNavigate, onBack }) => {

  const currentCycle = data[cycle];

  const typeLabels = {
    textbook: 'Textbooks',
    notes: 'Notes',
    pyqs: 'Previous Year Questions'
  };
  const typeIcons = { textbook: '📚', notes: '📝', pyqs: '📄' };
  const typeLabel = typeLabels[type] || type;
  const typeIcon = typeIcons[type] || '📂';

  if (!currentCycle) {
    return <div>Cycle not found</div>;
  }

  return (
    <div className="subjects-page">
      <main className="subjects-main">
        <div className="container">
          <div className="page-header">
            <div className="page-title">
              <span className="type-icon">{typeIcon}</span>
              <h2>{typeLabel} - {currentCycle.title}</h2>
            </div>
            <p>Select a subject to view available {type}</p>
          </div>
          <div className="subjects-grid">
            {currentCycle.subjects.map(subject => (
              <button
                key={subject.id}
                onClick={() => {
                  onNavigate('pdfList', { 
                    cycle: cycle, 
                    type: type, 
                    subjectId: subject.id 
                  });
                }}
                className="subject-card"
              >
                <div className="subject-icon">{subject.icon}</div>
                <h3>{subject.name}</h3>
                <div className="subject-type">
                  {typeIcon} {typeLabel}
                </div>
                <div className="arrow">→</div>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Subjects;