import React from 'react';
import ReactDOM from 'react-dom/client';
import interviewData from './data.json';
const App: React.FC = () => {    
  const [responses, setResponses] = useState<Array<{ question: string, response: string }>>([]);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(60);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<string>("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [currentFollowUpIndex, setCurrentFollowUpIndex] = useState<number>(0);
  const [isInterviewFinished, setIsInterviewFinished] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<{ username: string, password: string } | null>(null);

  
  /**
   * Loads a random question based on the given role and level and displays it.
   * @param role The role for the interview.
   * @param level The level for the interview.
   */
    const loadQuestion = (role: string, level: string, isFollowUp: boolean = false) => {
    const questionDisplay = document.getElementById('question-display');
    const responseInput = document.getElementById('response-input') as HTMLTextAreaElement;
  
    if (questionDisplay && responseInput) {
      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }
  
      // Save the previous question and response
      if (currentQuestion && !isInterviewFinished) {
        // Read the data in `responses.json`.
        let responsesData: Array<{ user: string, responses: Array<{ question: string, response: string }> }> = [];
        try {
          const responsesRawData = localStorage.getItem("responses");
          if (responsesRawData) {
            responsesData = JSON.parse(responsesRawData) as Array<{ user: string, responses: Array<{ question: string, response: string }> }>;
          }
        } catch (error) {
          console.error("Error reading responses data:", error);
        }
  
        const response = responseInput.value;
        // Find the responses of the current user in the `responses.json` file.
        let userResponses = responsesData.find(r => r.user === currentUser?.username);
        // If the current user do not have responses, create an empty responses array for this user.
        if (!userResponses) {
          userResponses = { user: currentUser?.username || "", responses: [] };
          responsesData.push(userResponses);
        }
  
        if (isFollowUp && userResponses.responses.length > 0) {
          // If is a follow up question, add to the previous question the new response.
          const lastResponseIndex = userResponses.responses.length - 1;
          userResponses.responses[lastResponseIndex].response += "\n" + response;
        } else {
          // Add the question and response to the user responses.
          userResponses.responses.push({ question: currentQuestion, response });
        }
  
        // Save the data to the `responses.json` file.
        localStorage.setItem("responses", JSON.stringify(responsesData));

        // Update the state to show the current responses in the alert
        const updatedResponses = responsesData.find(r => r.user === currentUser?.username)?.responses || [];
        setResponses(updatedResponses);
        
      }
  
      const questionsData = interviewData.find(item => item.role === role && item.level === level)?.questions;
      if (questionsData && questionsData.length > 0) {
        if (currentFollowUpIndex > 0) {
          // Handle follow-up questions
          const currentQuestionData = questionsData[currentQuestionIndex];
          if (currentQuestionData.followUps && currentQuestionData.followUps.length > currentFollowUpIndex) {
            const followUpQuestion = currentQuestionData.followUps[currentFollowUpIndex - 1];
            questionDisplay.textContent = followUpQuestion;
            setCurrentQuestion(followUpQuestion);
            setCurrentFollowUpIndex(currentFollowUpIndex + 1);
          } else {
            // No more follow-up questions, load a new question

            // Clear the response input for the next question
            responseInput.value = "";
        }

            const randomIndex = Math.floor(Math.random() * questionsData.length);
            const nextQuestion = questionsData[randomIndex].text;
            questionDisplay.textContent = nextQuestion;
            setCurrentQuestion(nextQuestion);
            setCurrentQuestionIndex(randomIndex);
            setCurrentFollowUpIndex(0);
          }
        } else if (!isInterviewFinished) {
          // Load a new question
          const randomIndex = Math.floor(Math.random() * questionsData.length);
          const nextQuestion = questionsData[randomIndex].text;
          questionDisplay.textContent = nextQuestion;
          setCurrentQuestion(nextQuestion);
          setCurrentQuestionIndex(randomIndex);
          setCurrentFollowUpIndex(1);

          // Clear the response input for the next question
          responseInput.value = "";
        }
        if(!isInterviewFinished){
          startTimer();
        } else {
          clearInterval(timerInterval || 0);
          setTimerInterval(null);
            }

            startTimer();
        }
      }
  };

  /**
   * Updates the timer display with the current seconds remaining.
   */
   const updateTimerDisplay = () => {
    const timerDisplay = document.getElementById('timer-display');
    if (timerDisplay) {
      timerDisplay.textContent = `Time remaining: ${secondsRemaining} seconds`;
    }
  };

  /**
   * Starts the timer for a question.
   */
  const startTimer = () => {
    setSecondsRemaining(60);
    updateTimerDisplay();

    const interval = setInterval(() => {
      setSecondsRemaining(prevSeconds => {
        const newSeconds = prevSeconds - 1;
        updateTimerDisplay();

        if (newSeconds === 0) {
          clearInterval(interval);
          setTimerInterval(null);
          finishInterview();
          return 0;
        }

        return newSeconds;
      });
    }, 1000);

    setTimerInterval(interval);
  };

  /**
   * Starts the interview by getting the selected role and level and loading the first question.
   */
  const startInterview = () => {
    setCurrentQuestionIndex(0);
    setCurrentFollowUpIndex(0);

    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
    setIsInterviewFinished(false);

    const roleSelect = document.getElementById('role-select') as HTMLSelectElement;
    const levelSelect = document.getElementById('level-select') as HTMLSelectElement;
    if (roleSelect && levelSelect) {
      const selectedRole = roleSelect.value;
      const selectedLevel = levelSelect.value;
      const startButton = document.getElementById('start-button');
      const nextButton = document.getElementById('next-button');
      const finishButton = document.getElementById('finish-button');

      if (startButton && nextButton && finishButton) {
        startButton.style.display = 'none';
        nextButton.style.display = 'inline-block';
        finishButton.style.display = 'inline-block';
      }
      loadQuestion(selectedRole, selectedLevel, false);
    }
  };

  /**
   * Finishes the interview:
   *  - Stops the timer.
   *  - Saves last response
   *  - Displays all responses in an alert.
   *  - Resets the responses array.
   *  - Updates button visibility.
   */
      const finishInterview = () => {
          setCurrentQuestionIndex(0);
          setCurrentFollowUpIndex(0);
          if (timerInterval) {
            clearInterval(timerInterval);
            setTimerInterval(null);
          }
        
          const roleSelect = document.getElementById('role-select') as HTMLSelectElement;
          const levelSelect = document.getElementById('level-select') as HTMLSelectElement;
          const role = roleSelect?.value;
          const level = levelSelect?.value;
          if (currentQuestion && role && level) {
            loadQuestion(role, level, currentFollowUpIndex > 0); // Save the last response
          }
        
          // Read the data in `responses.json`.
          let responsesData: Array<{ user: string, responses: Array<{ question: string, response: string }> }> = [];
          try {
            const responsesRawData = localStorage.getItem("responses");
            if (responsesRawData) {
              responsesData = JSON.parse(responsesRawData) as Array<{ user: string, responses: Array<{ question: string, response: string }> }>;
            }
          } catch (error) {
            console.error("Error reading responses data:", error);
          }
        
          // Find the responses of the current user in the `responses.json` file.
          const userResponses = responsesData.find(r => r.user === currentUser?.username)?.responses || [];
          
          let responsesText = "";
          userResponses.forEach((item, index) => {
            responsesText += `Question ${index + 1}: ${item.question}\nResponse ${index + 1}: ${item.response}\n`;
          });
          
          if (responsesText === "") {
            responsesText = "No responses recorded.";
          }
          
          alert("Interview finished. Your responses:\n\n" + responsesText);

          setResponses([]);
        
          // Update button visibility
          const startButton = document.getElementById('start-button');
          const nextButton = document.getElementById('next-button');
          const finishButton = document.getElementById('finish-button');
          
          if (startButton && nextButton && finishButton) {
            startButton.style.display = 'inline-block';
            nextButton.style.display = 'none';
            finishButton.style.display = 'none';

            // Remove the next-button event listener to avoid saving responses after finish the interview.
            const nextButtonClone = nextButton.cloneNode(true);
            nextButton.parentNode?.replaceChild(nextButtonClone, nextButton);
            nextButtonClone.addEventListener('click', () => {
              if (!isInterviewFinished) {
                  const isFollowUp = currentFollowUpIndex > 0;\n                  loadQuestion(roleSelect?.value || "", levelSelect?.value || "", isFollowUp);\n              } else {\n                finishInterview();\n
              }
            });
          }
          setIsInterviewFinished(true);
        };

  /**
   * Registers a new user. 
   */
  const registerUser = () => {
    const registerUsernameInput = document.getElementById('register-username') as HTMLInputElement;
    const registerPasswordInput = document.getElementById('register-password') as HTMLInputElement;

    if (registerUsernameInput && registerPasswordInput) {
      const username = registerUsernameInput.value;
      const password = registerPasswordInput.value;

      // Read the data in `users.json`.
      let usersData: Array<{ username: string, password: string }> = [];
      try {
        const usersRawData = localStorage.getItem("users");
        if (usersRawData) {
          usersData = JSON.parse(usersRawData) as Array<{ username: string, password: string }>;
        }
      } catch (error) {
        console.error("Error reading users data:", error);
      }

      // If the user already exists, show an alert "User already exists".
      const userExists = usersData.some(user => user.username === username);

      if (userExists) {
        alert("User already exists");
      } else {
        // If the user does not exist, add the new user to the data array and save the data to the `users.json` file.
        usersData.push({ username, password }); // Add this line
        localStorage.setItem("users", JSON.stringify(usersData));
        // Show an alert "User registered".
        alert("User registered");
        switchSection();
      }
    }
  };

  /**
   * Logs in a user
   */
    const loginUser = () => {
      const loginUsernameInput = document.getElementById('login-username') as HTMLInputElement;
      const loginPasswordInput = document.getElementById('login-password') as HTMLInputElement;
  
        if (loginUsernameInput && loginPasswordInput) {
            const username = loginUsernameInput.value;
            const password = loginPasswordInput.value;

            // Read the data in `users.json`.
            let usersData: Array<{ username: string, password: string }> = [];
            try {
                const usersRawData = localStorage.getItem("users");
                if (usersRawData) {
                    usersData = JSON.parse(usersRawData) as Array<{ username: string, password: string }>;
                }
            } catch (error) {
                console.error("Error reading users data:", error);
            }

            const user = usersData.find(u => u.username === username);

            if (user && user.password === password) {
                setCurrentUser(user);
                alert("User logged in");

                // Show main sections and hide login/register
                const roleSelection = document.getElementById('role-selection');
                const questionDisplay = document.getElementById('question-display');
                const responseInput = document.getElementById('response-input');
        const timerDisplay = document.getElementById('timer-display');
        const startButton = document.getElementById('start-button');
        const nextButton = document.getElementById('next-button');
        const finishButton = document.getElementById('finish-button');
        const registerSection = document.getElementById('register-section');
        const loginSection = document.getElementById('login-section');

        if (roleSelection && questionDisplay && responseInput && timerDisplay && startButton && nextButton && finishButton && registerSection && loginSection) {
          roleSelection.style.display = 'block';
          questionDisplay.style.display = 'block';
          responseInput.style.display = 'block';
          timerDisplay.style.display = 'block';
          startButton.style.display = 'inline-block';
          nextButton.style.display = 'none';
          finishButton.style.display = 'none';
          registerSection.style.display = 'none';
          loginSection.style.display = 'none';
        }
      } else {
        alert("Invalid user or password");
      }
    }
  };

  /**
   * Switches between the register and login sections.
   */
  const switchSection = () => {
    const registerSection = document.getElementById('register-section');
    const loginSection = document.getElementById('login-section');

    if (registerSection && loginSection) {
      if (registerSection.style.display === 'none') {
        registerSection.style.display = 'block';
        loginSection.style.display = 'none';
      } else {
        registerSection.style.display = 'none';
        loginSection.style.display = 'block';
      }
    }
  };









  useEffect(() => {
    document.getElementById('start-button')?.addEventListener('click', startInterview);
    document.getElementById('next-button')?.addEventListener('click', () => {
        if (isInterviewFinished) finishInterview();
      else if (currentRole && currentLevel) {
        const isFollowUp = currentFollowUpIndex > 0;
        loadQuestion(currentRole, currentLevel, isFollowUp);
      }
      });
    document.getElementById('finish-button')?.addEventListener('click', finishInterview);
    document.getElementById('register-button')?.addEventListener('click', registerUser);
    document.getElementById('login-button')?.addEventListener('click', loginUser);
    document.getElementById('switch-button')?.addEventListener('click', switchSection);
  }, []);
};

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(<App />);

