import { useState } from "react";
import "./App.css";
import StudentProfile from "./pages/StudentProfile";
import TeacherPanel from "./pages/TeacherPanel";

function App() {
  const [currentPage, setCurrentPage] = useState("main");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"student" | "teacher" | null>(null);
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const validCredentials = {
    student: { login: "student", password: "123" },
    teacher: { login: "teacher", password: "123" }
  };

  const handleOpenModal = (type: "student" | "teacher") => {
    setModalType(type);
    setIsModalOpen(true);
    setLogin("");
    setPassword("");
    setError("");
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalType(null);
    setLogin("");
    setPassword("");
    setError("");
  };

  const handleLogin = () => {
    if (!modalType) return;
    
    const credentials = validCredentials[modalType];
    if (login === credentials.login && password === credentials.password) {
      setIsModalOpen(false);
      setCurrentPage(modalType);
      setLogin("");
      setPassword("");
      setError("");
    } else {
      setError("Неверный логин или пароль");
    }
  };

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLogin(e.target.value);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  // Главное меню прямо здесь
  const MainMenu = () => (
    <div className="main-menu">
      <div className="left-text">
        <h1>ТРЕНАЖЕР<br />ПРИЕМОСДАТЧИКА<br />ГРУЗА И БАГАЖА</h1>
      </div>
      <div className="right-buttons">
        <div className="menu-buttons">
          <button 
            className="menu-btn student-btn"
            onClick={() => handleOpenModal("student")}
          >
            <span className="btn-title">УЧЕНИК</span>
            <span className="btn-subtitle">личный профиль</span>
          </button>
          
          <button 
            className="menu-btn teacher-btn"
            onClick={() => handleOpenModal("teacher")}
          >
            <span className="btn-title">ПРЕПОДАВАТЕЛЬ</span>
            <span className="btn-subtitle">панель управления</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {currentPage === "main" && <MainMenu />}
      {currentPage === "student" && <StudentProfile onBack={() => setCurrentPage("main")} />}
      {currentPage === "teacher" && <TeacherPanel onBack={() => setCurrentPage("main")} />}
      
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modalType === "student" ? "Вход для ученика" : "Вход для преподавателя"}</h2>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="input-group">
                <label>Логин</label>
                <input 
                  type="text" 
                  value={login}
                  onChange={handleLoginChange}
                  placeholder="Введите логин"
                  onKeyPress={handleKeyPress}
                  autoFocus
                />
              </div>
              
              <div className="input-group">
                <label>Пароль</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="Введите пароль"
                  onKeyPress={handleKeyPress}
                />
              </div>
              
              {error && <div className="error-message">{error}</div>}
            </div>
            
            <div className="modal-footer">
              <button className="modal-btn ok-btn" onClick={handleLogin}>ОК</button>
              <button className="modal-btn cancel-btn" onClick={handleCloseModal}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default App;