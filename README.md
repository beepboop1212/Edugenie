# EduGenie 🧞‍♂️

**EduGenie is an intelligent, AI-powered learning platform designed to transform any study material into an interactive and engaging educational experience. Tired of passively reading documents? With EduGenie, users can instantly generate personalized quizzes and dynamic, animated flashcards simply by providing a topic or uploading their own study files (PDF, DOCX, PPTX). Built with a powerful FastAPI backend and a modern Next.js frontend, EduGenie leverages the Google Gemini API to deliver context-aware content, complete with detailed explanations for quiz answers. It's not just a study tool; it's a personalized learning companion that adapts to your content.**

[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)

---

## ✨ Core Features

-   **Dual Generation Modes:** Instantly create either multiple-choice **Quizzes** or interactive **Flashcards**.
-   **Versatile Content Ingestion:** Generate content from a simple **topic name** or by **uploading your own documents** (PDF, DOCX, PPTX).
-   **AI-Powered Content:** Leverages the Google Gemini API to generate contextually relevant questions, answers, terms, and definitions.
-   **Detailed Quiz Review:** After completing a quiz, users can review their answers with AI-generated explanations for each question.
-   **Interactive Flashcard Viewer:** A beautiful, animated, flippable flashcard interface to make studying key terms engaging.
-   **Customizable Generation:** Users can specify the number of items to generate and provide a difficulty context (e.g., "for a beginner").
-   **Data Persistence:** User quiz scores and flashcard session completions are saved to a MongoDB database for future analytics.
-   **Modern & Minimalist UI:** A clean, aesthetic, and responsive user interface built with Next.js and a custom Ant Design theme.

## 🚀 Tech Stack

-   **Frontend:** Next.js, React, TypeScript, Ant Design, TanStack Query, Axios
-   **Backend:** Python, FastAPI
-   **AI Engine:** Google Gemini API
-   **Database:** MongoDB
-   **File Parsing:** PyMuPDF, python-docx, python-pptx

## 🛠️ Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

-   [Node.js](https://nodejs.org/) (v18 or later)
-   [Python](https://www.python.org/) (v3.9 or later) & `pip`
-   [Git](https://git-scm.com/)
-   **MongoDB Atlas Account:** A connection string for a free cluster.
-   **Google Gemini API Key:** An API key from [Google AI Studio](https://aistudio.google.com/app/apikey).

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/edugenie-hackathon.git
    cd edugenie-hackathon
    ```

2.  **Setup the Backend:**
    ```bash
    cd backend

    # Create and activate a virtual environment
    python3 -m venv venv
    source venv/bin/activate  # On Windows, use `venv\Scripts\activate`

    # Install dependencies
    pip install -r ../requirements.txt 
    # (If requirements.txt is not present, create it with `pip freeze > requirements.txt` after installing packages from the guide)

    # Create a .env file in the 'backend' directory
    touch .env
    ```
    Add your secrets to the `.env` file:
    ```env
    GEMINI_API_KEY="YOUR_GEMINI_API_KEY_HERE"
    MONGO_CONNECTION_STRING="YOUR_MONGODB_CONNECTION_STRING_HERE"
    ```

3.  **Setup the Frontend:**
    ```bash
    # From the root directory
    cd frontend

    # Install dependencies
    npm install
    ```

### Running the Project

You will need to run the backend and frontend servers in two separate terminals.

1.  **Run the Backend Server:**
    *(Terminal 1, from the `backend` directory)*
    ```bash
    # Make sure your virtual environment is activated
    uvicorn main:app --reload
    ```
    The backend will be running on `http://127.0.0.1:8000`.

2.  **Run the Frontend Server:**
    *(Terminal 2, from the `frontend` directory)*
    ```bash
    npm run dev
    ```
    The frontend will be running on `http://localhost:3000`. Open this URL in your browser.

## 📁 Project Structure

The project is organized into two main folders: `backend` and `frontend`.

```
.
├── backend/            # Contains the Python FastAPI application
│   ├── database.py     # MongoDB connection logic
│   ├── main.py         # Main API endpoints
│   ├── parsers.py      # Functions for parsing uploaded files
│   └── ...
├── frontend/           # Contains the Next.js React application
│   └── src/app/
│       ├── page.tsx    # The main application component
│       ├── layout.tsx    # The root layout and theme provider
│       └── flashcard.css # Custom styles for components
└── requirements.txt    # Python dependencies
```

## 🔮 Future Improvements

-   **User Authentication:** Implement JWT-based authentication for personalized user dashboards.
-   **Gamification:** Add badges, points, and leaderboards to further motivate users.
-   **Adaptive Testing:** Create quizzes that adjust in difficulty based on user performance.
-   **Live Q&A Forum:** A real-time moderated forum using WebSockets for community interaction.

---
*Built with ❤️ for the hackathon.*
