import { useState } from 'react';

interface StudentProfileProps {
  onBack: () => void;
}

interface UserData {
  lastName: string;
  firstName: string;
  patronymic: string;
  profession: string;
  group: string;
  foundDefects: number;
  availableLevel: string;
}

interface Defect {
  name: string;
  comment?: string;
}

interface LessonStats {
  id: number;
  date: string;
  theme: string;
  title: string;
  mode: string;
  grade: number;
  wagonType: string;
  defects: Defect[];
  comment?: string;
}

const StudentProfile = ({ onBack }: StudentProfileProps) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'statistics' | 'tasks'>('profile');

  // Данные пользователя (можно заменить на реальные данные из API)
  const userData: UserData = {
    lastName: 'Иванов',
    firstName: 'Иван',
    patronymic: 'Иванович',
    profession: 'Инженер-дефектоскопист',
    group: 'ПТ-42',
    foundDefects: 127,
    availableLevel: 'Средний'
  };

  // Данные статистики (можно заменить на реальные данные из API)
  const statisticsData: LessonStats[] = [
    {
      id: 1,
      date: '15.03.2026',
      theme: 'Дефектоскопия колесных пар',
      title: 'Урок 1: Визуальный осмотр',
      mode: 'Тренировочный',
      grade: 85,
      wagonType: 'Грузовой вагон',
      defects: [
        { name: 'Трещина ступицы', comment: 'Глубокие трещины в зоне ступицы, требуется замена' },
        { name: 'Износ гребня', comment: 'Превышение допустимого износа на 2 мм' }
      ],
      comment: 'Хорошая работа, но нужно больше внимания уделять трещинам'
    },
    {
      id: 2,
      date: '18.03.2026',
      theme: 'Ультразвуковой контроль',
      title: 'Урок 2: Работа с дефектоскопом',
      mode: 'Экзамен',
      grade: 92,
      wagonType: 'Пассажирский вагон',
      defects: [
        { name: 'Раковина на поверхности' } // Неисправность без комментария
      ],
      comment: 'Отлично!'
    },
    {
      id: 3,
      date: '22.03.2026',
      theme: 'Магнитопорошковый метод',
      title: 'Урок 3: Выявление трещин',
      mode: 'Тест',
      grade: 78,
      wagonType: 'Цистерна',
      defects: [
        { name: 'Поверхностные трещины', comment: 'Множественные трещины на корпусе' },
        { name: 'Сколы краски', comment: 'Требуется перекраска' }
      ],
      comment: 'Требуется дополнительная практика'
    },
    {
      id: 4,
      date: '25.03.2026',
      theme: 'Вихретоковый контроль',
      title: 'Урок 4: Контроль подшипников',
      mode: 'Самостоятельная',
      grade: 88,
      wagonType: 'Рефрижератор',
      defects: [], // Неисправностей не обнаружено
      comment: 'Хороший результат'
    }
  ];

  const renderDefects = (defects: Defect[]) => {
    if (defects.length === 0) {
      return <span className="no-defects">Дефектов не обнаружено</span>;
    }
    
    return (
      <div className="defects-list">
        {defects.map((defect, index) => (
          <div key={index} className="defect-item">
            <span className="defect-name">{defect.name}</span>
            {defect.comment && (
              <span className="defect-comment">: {defect.comment}</span>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <>
            <h2>Личный кабинет</h2>
            <div className="profile-info">
              <div className="info-row">
                <span className="info-label">Фамилия:</span>
                <span className="info-value">{userData.lastName}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Имя:</span>
                <span className="info-value">{userData.firstName}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Отчество:</span>
                <span className="info-value">{userData.patronymic}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Профессия:</span>
                <span className="info-value">{userData.profession}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Группа:</span>
                <span className="info-value">{userData.group}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Найдено исправностей:</span>
                <span className="info-value defect-count">{userData.foundDefects}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Доступный уровень сложности:</span>
                <span className="info-value difficulty-level">{userData.availableLevel}</span>
              </div>
            </div>
          </>
        );
      case 'statistics':
        return (
          <>
            <h2>Статистика прохождения уроков</h2>
            <div className="statistics-table-container">
              <table className="statistics-table">
                <thead>
                  <tr>
                    <th>Дата</th>
                    <th>Тема</th>
                    <th>Название</th>
                    <th>Режим</th>
                    <th>Оценка</th>
                    <th>Тип вагона</th>
                    <th>Неисправности</th>
                    <th>Комментарий</th>
                  </tr>
                </thead>
                <tbody>
                  {statisticsData.map((stat) => (
                    <tr key={stat.id}>
                      <td>{stat.date}</td>
                      <td>{stat.theme}</td>
                      <td>{stat.title}</td>
                      <td>{stat.mode}</td>
                      <td>{stat.grade}</td>
                      <td>{stat.wagonType}</td>
                      <td className="defects-cell">{renderDefects(stat.defects)}</td>
                      <td className="comment-cell">{stat.comment || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        );
      case 'tasks':
        return (
          <>
            <h2>Задания</h2>
            <p>Здесь будут доступные задания для прохождения</p>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div className="student-page">
        <div className="student-work-area">
          {renderContent()}
        </div>

        <div className="student-sidebar">
          <div className="menu-buttons-wrapper">
            <div className="menu-buttons">
              <button 
                className={`menu-btn student-btn ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                <span className="btn-title">Личный кабинет</span>
              </button>
              
              <button 
                className={`menu-btn teacher-btn ${activeTab === 'statistics' ? 'active' : ''}`}
                onClick={() => setActiveTab('statistics')}
              >
                <span className="btn-title">Статистика</span>
                <span className="btn-subtitle">данные о пройденных уроках</span>
              </button>
              
              <button 
                className={`menu-btn guest-btn ${activeTab === 'tasks' ? 'active' : ''}`}
                onClick={() => setActiveTab('tasks')}
              >
                <span className="btn-title">Задания</span>
                <span className="btn-subtitle">выберите задания для прохождения</span>
              </button>
              <button className="modal-btn cancel-btn" onClick={onBack}>Выход</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default StudentProfile;