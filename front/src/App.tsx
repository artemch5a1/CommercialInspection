import { useState, useEffect } from "react";
import "./App.css";
import StudentProfile from "./pages/StudentProfile";
import TeacherPanel from "./pages/TeacherPanel";
import { loginUser, setCurrentUser, getCurrentUser, clearCurrentUser } from "./services/api";

function App() {
  const [currentPage, setCurrentPage] = useState("main");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"student" | "teacher" | null>(null);
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const checkSavedUser = async () => {
      const result = await getCurrentUser();
      if (result.success && result.user) {
        const user = result.user;
        const userRole = user.role_text || (user.role === true ? "teacher" : "student");
        console.log('Найден сохраненный пользователь с ролью:', userRole);
        console.log('Остаемся на главной странице');
      }
    };
    checkSavedUser();
  }, []);

  const handleOpenModal = (type: "student" | "teacher") => {
    setModalType(type);
    setIsModalOpen(true);
    setLogin("");
    setPassword("");
    setError("");
    setShowPassword(false);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalType(null);
    setLogin("");
    setPassword("");
    setError("");
    setShowPassword(false);
  };

  const handleLogin = async () => {
    if (!modalType) return;
    
    setLoading(true);
    setError("");
    
    try {
      const result = await loginUser(login, password);
      
      console.log("Login result:", result);
      
      if (result && result.success) {
        const userData = result.user;
        const userRole = result.role || (userData.role_text) || (userData.role === true ? "teacher" : "student");
        
        console.log("User role:", userRole);
        console.log("Modal type:", modalType);
        
        if (modalType === userRole) {
          setCurrentUser(userData);
          setIsModalOpen(false);
          setLogin("");
          setPassword("");
          setError("");
          setShowPassword(false);
          setCurrentPage(userRole);
        } else {
          setError(`Роль пользователя (${userRole}) не соответствует выбранной (${modalType})`);
        }
      } else {
        setError(result?.error || "Неверный логин или пароль");
      }
    } catch (error) {
      console.error("Ошибка входа:", error);
      setError("Ошибка подключения к серверу");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearCurrentUser();
    setCurrentPage("main");
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

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

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
      {currentPage === "student" && <StudentProfile onBack={handleLogout} />}
      {currentPage === "teacher" && <TeacherPanel onBack={handleLogout} />}

      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modalType === "student" ? "Вход для ученика" : "Вход для преподавателя"}</h2>
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
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={handlePasswordChange}
                    placeholder="Введите пароль"
                    onKeyPress={handleKeyPress}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={toggleShowPassword}
                    title={showPassword ? "Скрыть пароль" : "Показать пароль"}
                  >
                    {showPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {error && <div className="error-message">{error}</div>}
            </div>

            <div className="modal-footer">
              <button 
                className="modal-btn ok-btn" 
                onClick={handleLogin}
                disabled={loading}
              >
                {loading ? "Вход..." : "ОК"}
              </button>
              <button className="modal-btn cancel-btn" onClick={handleCloseModal}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default App;