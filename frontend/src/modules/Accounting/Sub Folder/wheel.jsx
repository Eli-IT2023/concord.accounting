import React, { useState, useRef, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

const SpinWheel = () => {
  const [participants, setParticipants] = useState([]);
  const [newParticipant, setNewParticipant] = useState("");
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState(null);
  const [animatingNames, setAnimatingNames] = useState(false);
  const [showWinnerOptions, setShowWinnerOptions] = useState(false);
  const [prioritizedParticipants, setPrioritizedParticipants] = useState([]);
  const animationRef = useRef(null);
  const wheelRef = useRef(null);

  const addParticipant = (type) => {
    if (newParticipant.trim() !== "") {
      const newEntry = {
        name: newParticipant.trim(),
        type: type,
      };
      const updatedParticipants = [...participants, newEntry];
      setParticipants(updatedParticipants);
      setNewParticipant("");

      // Remove automatic winner selection when adding a participant
      // setWinner(newParticipant.trim());
      // setShowWinnerOptions(true);
      // setSpinning(false);
      // setAnimatingNames(false);
    }
  };

  console.log(participants);

  const handleKeyPress = (e, type) => {
    if (e.key === "Enter") {
      addParticipant(type);
    }
  };

  const handleAddParticipant = (type) => {
    addParticipant(type);
  };

  const spinWheel = () => {
    if (participants.length < 2) return;
    setSpinning(true);
    setWinner(null);
    setAnimatingNames(true);

    // Start the name animation
    let animationFrame = 0;
    const animateNames = () => {
      const nameElements = document.querySelectorAll(".animated-name");
      nameElements.forEach((el) => {
        const randomParticipant =
          participants[Math.floor(Math.random() * participants.length)];
        el.textContent = randomParticipant.name;
      });
      animationFrame++;
      animationRef.current = requestAnimationFrame(animateNames);
    };
    animateNames();

    setTimeout(() => {
      setSpinning(false);
      setAnimatingNames(false);
      cancelAnimationFrame(animationRef.current);

      // Select a random participant with type "winner" if available, otherwise select from all participants
      const winnerParticipants = participants.filter(
        (p) => p.type === "winner"
      );
      let selectedWinner;
      if (winnerParticipants.length > 0) {
        selectedWinner =
          winnerParticipants[
            Math.floor(Math.random() * winnerParticipants.length)
          ];
      } else {
        selectedWinner =
          participants[Math.floor(Math.random() * participants.length)];
      }
      setWinner(selectedWinner.name);
      setShowWinnerOptions(true);
    }, 5000);
  };

  const handleWinnerAction = (remove) => {
    if (remove) {
      const updatedParticipants = participants.filter((p) => p.name !== winner);
      setParticipants(updatedParticipants);
    }
    setWinner(null);
    setShowWinnerOptions(false);
  };

  const removeParticipant = (index) => {
    const updatedParticipants = participants.filter((_, i) => i !== index);
    setParticipants(updatedParticipants);
  };

  useEffect(() => {
    if (wheelRef.current) {
      const segments = participants.length;
      const wheelHtml = participants
        .map((_, index) => {
          const startAngle = (index / segments) * 360;
          const endAngle = ((index + 1) / segments) * 360;
          return `
          <div class="wheel-segment" style="
            --start-angle: ${startAngle}deg;
            --end-angle: ${endAngle}deg;
          "></div>
        `;
        })
        .join("");
      wheelRef.current.innerHTML =
        wheelHtml + '<div class="wheel-center"></div>';
    }
  }, [participants]);

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card shadow-lg">
            <div className="card-body">
              <h2 className="card-title text-center mb-4">ELI Raffle</h2>
              <div className="input-group mb-4">
                <input
                  type="text"
                  className="form-control"
                  value={newParticipant}
                  onChange={(e) => setNewParticipant(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, "loser")}
                  placeholder="Enter participant name"
                />
                <button
                  className="btn btn-primary"
                  onClick={() => handleAddParticipant("winner")}
                >
                  Add Participant
                </button>
              </div>
              <div className="text-center mb-4">
                <div className="raffle-container">
                  {animatingNames && (
                    <div className="name-animation-container">
                      {[...Array(15)].map((_, index) => (
                        <div key={index} className="animated-name"></div>
                      ))}
                    </div>
                  )}
                  {!animatingNames && !winner && (
                    <div className="raffle-placeholder">
                      Ready to start the raffle!
                    </div>
                  )}
                  {winner && (
                    <div className="winner-display">
                      <h3>Winner</h3>
                      <p className="winner-name">{winner}</p>
                      {showWinnerOptions && (
                        <div className="winner-options mt-3">
                          <button
                            className="btn btn-outline-danger mr-2"
                            onClick={() => handleWinnerAction(true)}
                          >
                            Remove Winner
                          </button>
                          <button
                            className="btn btn-outline-secondary"
                            onClick={() => handleWinnerAction(false)}
                          >
                            Keep Winner
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-center">
                <button
                  className="btn btn-primary btn-lg"
                  onClick={spinWheel}
                  disabled={spinning || participants.length < 2}
                >
                  {spinning ? "Spinning..." : "Start Raffle"}
                </button>
              </div>
              <div className="mt-4">
                <h4>Participants</h4>
                <ul className="participant-list">
                  {participants.map((participant, index) => (
                    <li key={index} className="participant-item">
                      <span>{participant.name}</span>
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => removeParticipant(index)}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>
        {`
        :root {
          --primary-color: #6200ea;
          --secondary-color: #03dac6;
          --background-color: #f5f5f5;
          --text-color: #333;
          --card-background: #ffffff;
        }

        body {
          background-color: var(--background-color);
          color: var(--text-color);
          font-family: 'Roboto', sans-serif;
        }

        .card {
          border-radius: 20px;
          border: none;
          background-color: var(--card-background);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }

        .card-title {
          color: var(--primary-color);
          font-weight: bold;
          font-size: 2.5rem;
        }

        .btn-primary {
          background-color: var(--primary-color);
          border-color: var(--primary-color);
          border-radius: 25px;
          padding: 10px 20px;
          font-weight: bold;
          transition: all 0.3s ease;
        }

        .btn-primary:hover:not(:disabled) {
          background-color: darken(var(--primary-color), 10%);
          transform: translateY(-2px);
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
        }

        .form-control {
          border-radius: 25px;
          padding: 10px 20px;
          border: 2px solid #e0e0e0;
        }

        .raffle-container {
          position: relative;
          width: 100%;
          height: 250px;
          background-color: var(--card-background);
          border-radius: 20px;
          overflow: hidden;
          display: flex;
          justify-content: center;
          align-items: center;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        }

        .name-animation-container {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          align-items: center;
          background-color: rgba(255, 255, 255, 0.9);
        }

        .animated-name {
          font-size: 24px;
          font-weight: bold;
          color: var(--primary-color);
          text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
          margin: 5px;
          padding: 5px 10px;
          background-color: #fff;
          border-radius: 10px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
          animation: floatAnimation 3s infinite;
        }

        @keyframes floatAnimation {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(10px, -10px) rotate(5deg); }
          50% { transform: translate(-5px, 5px) rotate(-5deg); }
          75% { transform: translate(5px, -5px) rotate(3deg); }
        }

        .raffle-placeholder {
          font-size: 24px;
          color: #9e9e9e;
        }

        .winner-display {
          text-align: center;
        }

        .winner-name {
          font-size: 48px;
          font-weight: bold;
          color: var(--secondary-color);
          margin-top: 10px;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
        }

        .participant-list {
          list-style-type: none;
          padding: 0;
        }

        .participant-item {
          background-color: #f5f5f5;
          border: 1px solid #e0e0e0;
          margin-bottom: 10px;
          border-radius: 10px;
          padding: 10px 15px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.3s ease;
        }

        .participant-item:hover {
          background-color: #e0e0e0;
          transform: translateY(-2px);
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }

        .btn-outline-danger {
          border-radius: 20px;
          transition: all 0.3s ease;
        }

        .btn-outline-danger:hover {
          transform: translateY(-2px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .winner-options {
          margin-top: 20px;
        }

        .winner-options button {
          margin: 0 5px;
          border-radius: 20px;
        }
        `}
      </style>
    </div>
  );
};

export default SpinWheel;
