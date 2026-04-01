import { useState } from 'react';

interface TeacherProfileProps {
  onBack: () => void;
}

interface Student {
  id: number;
  lastName: string;
  firstName: string;
  patronymic: string;
  group: string;
  profession: string;
}

interface RegistrationFormData {
  login: string;
  password: string;
  lastName: string;
  firstName: string;
  patronymic: string;
  gender: string;
  group: string;
  profession: string;
}

interface ManagementItem {
  id: number;
  name: string;
}

interface Defect {
  id: number;
  name: string;
  description: string;
}

interface Assignment {
  id: number;
  topic: string;
  title: string;
  description: string;
  modes: string[];
  weather: string;
  timeOfDay: string;
  assignedTo: string[];
  groups: string[];
  students: number[];
  selectedDefects: number[];
  createdAt: string;
}

const TeacherProfile = ({ onBack }: TeacherProfileProps) => {
  const [activeTab, setActiveTab] = useState<'all-students' | 'registration' | 'management' | 'assignments'>('all-students');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [selectedProfession, setSelectedProfession] = useState<string>('all');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Состояние для формы регистрации
  const [formData, setFormData] = useState<RegistrationFormData>({
    login: '',
    password: '',
    lastName: '',
    firstName: '',
    patronymic: '',
    gender: '',
    group: '',
    profession: ''
  });

  // Состояния для управления
  const [managementType, setManagementType] = useState<'groups' | 'professions' | 'topics'>('groups');
  const [groups, setGroups] = useState<ManagementItem[]>([
    { id: 1, name: 'ПТ-41' },
    { id: 2, name: 'ПТ-42' },
    { id: 3, name: 'ПТ-43' }
  ]);
  const [professions, setProfessions] = useState<ManagementItem[]>([
    { id: 1, name: 'Инженер-дефектоскопист' },
    { id: 2, name: 'Техник-дефектоскопист' }
  ]);
  const [topics, setTopics] = useState<ManagementItem[]>([
    { id: 1, name: 'Дефектоскопия колесных пар' },
    { id: 2, name: 'Ультразвуковой контроль' },
    { id: 3, name: 'Магнитопорошковый метод' }
  ]);

  // Состояние для модального окна создания
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [currentManagementType, setCurrentManagementType] = useState<'groups' | 'professions' | 'topics'>('groups');

  // Состояние для модального окна редактирования
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ManagementItem | null>(null);
  const [editItemName, setEditItemName] = useState('');

  // Состояние для модального окна подтверждения удаления
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ManagementItem | null>(null);

  // Состояние для создания задания
  const [newAssignment, setNewAssignment] = useState({
    topic: '',
    title: '',
    description: '',
    modes: [] as string[],
    weather: '',
    timeOfDay: '',
    assignedTo: [] as string[],
    groups: [] as string[],
    students: [] as number[],
    selectedDefects: [] as number[]
  });
  const [selectedAssignedType, setSelectedAssignedType] = useState<string>('');

  // Список неисправностей
  const [availableDefects, setAvailableDefects] = useState<Defect[]>([
    { id: 1, name: 'Трещина ступицы', description: 'Трещина в ступице колеса' },
    { id: 2, name: 'Износ гребня', description: 'Превышение допустимого износа гребня' },
    { id: 3, name: 'Раковина на поверхности', description: 'Раковина на поверхности детали' },
    { id: 4, name: 'Поверхностные трещины', description: 'Множественные трещины на корпусе' },
    { id: 5, name: 'Сколы краски', description: 'Сколы лакокрасочного покрытия' },
    { id: 6, name: 'Деформация', description: 'Деформация конструкции' }
  ]);
  const [selectedDefects, setSelectedDefects] = useState<Defect[]>([]);

  // Задания
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  // Список учеников
  const studentsList: Student[] = [
    { id: 1, lastName: 'Иванов', firstName: 'Иван', patronymic: 'Иванович', group: 'ПТ-41', profession: 'Инженер-дефектоскопист' },
    { id: 2, lastName: 'Петрова', firstName: 'Анна', patronymic: 'Сергеевна', group: 'ПТ-41', profession: 'Техник-дефектоскопист' },
    { id: 3, lastName: 'Сидоров', firstName: 'Алексей', patronymic: 'Владимирович', group: 'ПТ-42', profession: 'Инженер-дефектоскопист' },
    { id: 4, lastName: 'Кузнецова', firstName: 'Елена', patronymic: 'Андреевна', group: 'ПТ-42', profession: 'Техник-дефектоскопист' },
    { id: 5, lastName: 'Михайлов', firstName: 'Дмитрий', patronymic: 'Петрович', group: 'ПТ-43', profession: 'Инженер-дефектоскопист' },
    { id: 6, lastName: 'Соколова', firstName: 'Мария', patronymic: 'Игоревна', group: 'ПТ-43', profession: 'Техник-дефектоскопист' }
  ];

  // Данные учеников для таблицы
  const [students, setStudents] = useState<Student[]>(studentsList);

  // Список групп и профессий для селектов
  const groupOptions = groups.map(g => g.name);
  const professionOptions = professions.map(p => p.name);
  const topicOptions = topics.map(t => t.name);
  const weatherOptions = ['Ясно', 'Облачно', 'Дождь', 'Туман'];
  const timeOptions = ['Утро', 'День', 'Вечер', 'Ночь'];
  const modeOptions = ['Обучение', 'Экзамен', 'Тест', 'Самостоятельная'];

  // Обработчики для создания задания
  const handleOpenCreateForm = () => {
    setNewAssignment({
      topic: '',
      title: '',
      description: '',
      modes: [],
      weather: '',
      timeOfDay: '',
      assignedTo: [],
      groups: [],
      students: [],
      selectedDefects: []
    });
    setSelectedDefects([]);
    setSelectedAssignedType('');
    setAvailableDefects([
      { id: 1, name: 'Трещина ступицы', description: 'Трещина в ступице колеса' },
      { id: 2, name: 'Износ гребня', description: 'Превышение допустимого износа гребня' },
      { id: 3, name: 'Раковина на поверхности', description: 'Раковина на поверхности детали' },
      { id: 4, name: 'Поверхностные трещины', description: 'Множественные трещины на корпусе' },
      { id: 5, name: 'Сколы краски', description: 'Сколы лакокрасочного покрытия' },
      { id: 6, name: 'Деформация', description: 'Деформация конструкции' }
    ]);
    setShowCreateForm(true);
  };

  const handleModeChange = (mode: string) => {
    if (mode === 'Все') {
      if (newAssignment.modes.length === modeOptions.length) {
        setNewAssignment(prev => ({ ...prev, modes: [] }));
      } else {
        setNewAssignment(prev => ({ ...prev, modes: [...modeOptions] }));
      }
    } else {
      setNewAssignment(prev => ({
        ...prev,
        modes: prev.modes.includes(mode)
          ? prev.modes.filter(m => m !== mode)
          : [...prev.modes, mode]
      }));
    }
  };

  const handleAssignedToChange = (type: string) => {
    if (selectedAssignedType === type) {
      setSelectedAssignedType('');
      setNewAssignment(prev => ({ ...prev, assignedTo: [], groups: [], students: [] }));
    } else {
      setSelectedAssignedType(type);
      setNewAssignment(prev => ({ ...prev, assignedTo: [type], groups: [], students: [] }));
    }
  };

  const handleGroupSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setNewAssignment(prev => ({ ...prev, groups: selectedOptions }));
  };

  const handleStudentSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => Number(option.value));
    setNewAssignment(prev => ({ ...prev, students: selectedOptions }));
  };

  const handleAddDefect = (defect: Defect) => {
    setAvailableDefects(availableDefects.filter(d => d.id !== defect.id));
    setSelectedDefects([...selectedDefects, defect]);
  };

  const handleRemoveDefect = (defect: Defect) => {
    setSelectedDefects(selectedDefects.filter(d => d.id !== defect.id));
    setAvailableDefects([...availableDefects, defect].sort((a, b) => a.id - b.id));
  };

  const handleCreateAssignment = () => {
    if (!newAssignment.topic || !newAssignment.title || !newAssignment.description) {
      alert('Заполните обязательные поля');
      return;
    }

    const newAssignmentItem: Assignment = {
      id: Date.now(),
      topic: newAssignment.topic,
      title: newAssignment.title,
      description: newAssignment.description,
      modes: newAssignment.modes,
      weather: newAssignment.weather,
      timeOfDay: newAssignment.timeOfDay,
      assignedTo: newAssignment.assignedTo,
      groups: newAssignment.groups,
      students: newAssignment.students,
      selectedDefects: selectedDefects.map(d => d.id),
      createdAt: new Date().toLocaleString()
    };

    setAssignments([...assignments, newAssignmentItem]);
    setShowCreateForm(false);
    alert('Задание успешно создано!');
  };

  const getAssignmentsByTopic = (topic: string) => {
    return assignments.filter(a => a.topic === topic);
  };

  const getUniqueTopicsWithAssignments = () => {
    const topicsWithAssignments = new Set(assignments.map(a => a.topic));
    return topics.filter(t => topicsWithAssignments.has(t.name));
  };

  // Остальные обработчики...
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGenderChange = (gender: string) => {
    setFormData(prev => ({ ...prev, gender }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newStudent: Student = {
      id: Date.now(),
      lastName: formData.lastName,
      firstName: formData.firstName,
      patronymic: formData.patronymic,
      group: formData.group,
      profession: formData.profession
    };
    setStudents([...students, newStudent]);
    alert('Пользователь зарегистрирован!');
    setFormData({
      login: '',
      password: '',
      lastName: '',
      firstName: '',
      patronymic: '',
      gender: '',
      group: '',
      profession: ''
    });
  };

  const handleOpenCreateModal = (type: 'groups' | 'professions' | 'topics') => {
    setCurrentManagementType(type);
    setNewItemName('');
    setIsCreateModalOpen(true);
  };

  const handleCreateItem = () => {
    if (!newItemName.trim()) {
      alert('Введите наименование');
      return;
    }

    const newItem: ManagementItem = {
      id: Date.now(),
      name: newItemName.trim()
    };

    switch (currentManagementType) {
      case 'groups':
        setGroups([...groups, newItem]);
        break;
      case 'professions':
        setProfessions([...professions, newItem]);
        break;
      case 'topics':
        setTopics([...topics, newItem]);
        break;
    }

    setIsCreateModalOpen(false);
    setNewItemName('');
  };

  const handleOpenEditModal = (item: ManagementItem) => {
    setEditingItem(item);
    setEditItemName(item.name);
    setIsEditModalOpen(true);
  };

  const handleEditItem = () => {
    if (!editItemName.trim() || !editingItem) {
      alert('Введите наименование');
      return;
    }

    switch (managementType) {
      case 'groups':
        setGroups(groups.map(g => g.id === editingItem.id ? { ...g, name: editItemName.trim() } : g));
        break;
      case 'professions':
        setProfessions(professions.map(p => p.id === editingItem.id ? { ...p, name: editItemName.trim() } : p));
        break;
      case 'topics':
        setTopics(topics.map(t => t.id === editingItem.id ? { ...t, name: editItemName.trim() } : t));
        break;
    }

    setIsEditModalOpen(false);
    setEditingItem(null);
    setEditItemName('');
  };

  const handleOpenDeleteModal = (item: ManagementItem) => {
    setItemToDelete(item);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (itemToDelete) {
      switch (managementType) {
        case 'groups':
          setGroups(groups.filter(g => g.id !== itemToDelete.id));
          break;
        case 'professions':
          setProfessions(professions.filter(p => p.id !== itemToDelete.id));
          break;
        case 'topics':
          setTopics(topics.filter(t => t.id !== itemToDelete.id));
          break;
      }
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setItemToDelete(null);
  };

  const getTypeName = (type: 'groups' | 'professions' | 'topics') => {
    switch (type) {
      case 'groups': return 'Группа';
      case 'professions': return 'Профессия';
      case 'topics': return 'Тема';
    }
  };

  const getCurrentItems = () => {
    switch (managementType) {
      case 'groups': return groups;
      case 'professions': return professions;
      case 'topics': return topics;
    }
  };

  const groupsForFilter = ['all', ...new Set(students.map(s => s.group))];
  const professionsForFilter = ['all', ...new Set(students.map(s => s.profession))];

  const filteredStudents = students.filter(student => {
    const matchesSearch = `${student.lastName} ${student.firstName} ${student.patronymic}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    
    const matchesGroup = selectedGroup === 'all' || student.group === selectedGroup;
    const matchesProfession = selectedProfession === 'all' || student.profession === selectedProfession;
    
    return matchesSearch && matchesGroup && matchesProfession;
  });

  const renderContent = () => {
    switch (activeTab) {
     case 'all-students':
  return (
    <>
      <h2>Все ученики</h2>
      <div className="filters-panel">
        <div className="search-box">
          <input
            type="text"
            placeholder="Поиск по ФИО..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-group">
          <label>Группа:</label>
          <select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)} className="filter-select">
            {groupsForFilter.map(group => (
              <option key={group} value={group}>{group === 'all' ? 'Все группы' : group}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Профессия:</label>
          <select value={selectedProfession} onChange={(e) => setSelectedProfession(e.target.value)} className="filter-select">
            {professionsForFilter.map(profession => (
              <option key={profession} value={profession}>{profession === 'all' ? 'Все профессии' : profession}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="students-table-container">
        <table className="students-table">
          <thead>
            <tr>
              <th>ФИО ученика</th>
              <th>Группа</th>
              <th>Профессия</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student) => (
                <tr key={student.id}>
                  <td>{`${student.lastName} ${student.firstName} ${student.patronymic}`}</td>
                  <td>{student.group}</td>
                  <td>{student.profession}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="no-data">Ученики не найдены</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
      case 'registration':
        return (
          <>
            <h2>Регистрация пользователей</h2>
            <form className="registration-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Логин *</label>
                  <input type="text" name="login" value={formData.login} onChange={handleInputChange} required placeholder="Введите логин" />
                </div>
                <div className="form-group">
                  <label>Пароль *</label>
                  <input type="password" name="password" value={formData.password} onChange={handleInputChange} required placeholder="Введите пароль" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Фамилия *</label>
                  <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} required placeholder="Введите фамилию" />
                </div>
                <div className="form-group">
                  <label>Имя *</label>
                  <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} required placeholder="Введите имя" />
                </div>
                <div className="form-group">
                  <label>Отчество</label>
                  <input type="text" name="patronymic" value={formData.patronymic} onChange={handleInputChange} placeholder="Введите отчество" />
                </div>
              </div>
              <div className="form-group">
                <label>Пол *</label>
                <div className="gender-group">
                  <label className="gender-option">
                    <input type="radio" name="gender" value="male" checked={formData.gender === 'male'} onChange={() => handleGenderChange('male')} />
                    <span>Мужской</span>
                  </label>
                  <label className="gender-option">
                    <input type="radio" name="gender" value="female" checked={formData.gender === 'female'} onChange={() => handleGenderChange('female')} />
                    <span>Женский</span>
                  </label>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Группа *</label>
                  <select name="group" value={formData.group} onChange={handleInputChange} required>
                    <option value="">Выберите группу</option>
                    {groupOptions.map(group => (<option key={group} value={group}>{group}</option>))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Профессия *</label>
                  <select name="profession" value={formData.profession} onChange={handleInputChange} required>
                    <option value="">Выберите профессию</option>
                    {professionOptions.map(profession => (<option key={profession} value={profession}>{profession}</option>))}
                  </select>
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="submit-btn">Зарегистрировать</button>
                <button type="button" className="reset-btn" onClick={() => setFormData({
                  login: '', password: '', lastName: '', firstName: '', patronymic: '', gender: '', group: '', profession: ''
                })}>Очистить</button>
              </div>
            </form>
          </>
        );
      case 'management':
        return (
          <>
            <h2>Управление группами и профессиями</h2>
            <div className="management-buttons">
              <button className={`management-type-btn ${managementType === 'groups' ? 'active' : ''}`} onClick={() => setManagementType('groups')}>Группы</button>
              <button className={`management-type-btn ${managementType === 'professions' ? 'active' : ''}`} onClick={() => setManagementType('professions')}>Профессии</button>
              <button className={`management-type-btn ${managementType === 'topics' ? 'active' : ''}`} onClick={() => setManagementType('topics')}>Темы</button>
              <button className="create-btn" onClick={() => handleOpenCreateModal(managementType)}>+ Создать</button>
            </div>
            <div className="management-list">
              {getCurrentItems().map(item => (
                <div key={item.id} className="management-item">
                  <span className="item-name">{item.name}</span>
                  <div className="item-actions">
                    <button className="edit-btn" onClick={() => handleOpenEditModal(item)}>Редактировать</button>
                    <button className="delete-btn" onClick={() => handleOpenDeleteModal(item)}>Удалить</button>
                  </div>
                </div>
              ))}
            </div>
            {isCreateModalOpen && (
              <div className="modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <h3>Создание {getTypeName(currentManagementType)}</h3>
                  <div className="modal-form-group">
                    <label>Наименование {getTypeName(currentManagementType).toLowerCase()}</label>
                    <input type="text" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} placeholder={`Введите наименование ${getTypeName(currentManagementType).toLowerCase()}`} autoFocus />
                  </div>
                  <div className="modal-actions">
                    <button className="modal-submit-btn" onClick={handleCreateItem}>Создать</button>
                    <button className="modal-cancel-btn" onClick={() => setIsCreateModalOpen(false)}>Отмена</button>
                  </div>
                </div>
              </div>
            )}
            {isEditModalOpen && editingItem && (
              <div className="modal-overlay" onClick={() => setIsEditModalOpen(false)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <h3>Редактирование {getTypeName(managementType)}</h3>
                  <div className="modal-form-group">
                    <label>Наименование {getTypeName(managementType).toLowerCase()}</label>
                    <input type="text" value={editItemName} onChange={(e) => setEditItemName(e.target.value)} placeholder={`Введите наименование ${getTypeName(managementType).toLowerCase()}`} autoFocus />
                  </div>
                  <div className="modal-actions">
                    <button className="modal-submit-btn" onClick={handleEditItem}>Сохранить</button>
                    <button className="modal-cancel-btn" onClick={() => setIsEditModalOpen(false)}>Отмена</button>
                  </div>
                </div>
              </div>
            )}
            {isDeleteModalOpen && itemToDelete && (
              <div className="modal-overlay" onClick={handleCancelDelete}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <h3>Подтверждение удаления</h3>
                  <div className="modal-form-group">
                    <p style={{ color: '#ffffff', fontSize: '16px' }}>Вы уверены, что хотите удалить "{itemToDelete.name}"?</p>
                  </div>
                  <div className="modal-actions">
                    <button className="modal-submit-btn" onClick={handleConfirmDelete}>Удалить</button>
                    <button className="modal-cancel-btn" onClick={handleCancelDelete}>Отмена</button>
                  </div>
                </div>
              </div>
            )}
          </>
        );
      case 'assignments':
        return (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>Управление заданиями</h2>
              <button className="create-btn" onClick={handleOpenCreateForm}>+ Создать задание</button>
            </div>

            {showCreateForm && (
              <div className="create-assignment-form">
                <h3>Создание нового задания</h3>
                <div className="form-scroll">
                  <div className="form-group">
                    <label>Тема *</label>
                    <select value={newAssignment.topic} onChange={(e) => setNewAssignment({...newAssignment, topic: e.target.value})}>
                      <option value="">Выберите тему</option>
                      {topicOptions.map(topic => (<option key={topic} value={topic}>{topic}</option>))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Название *</label>
                    <input type="text" value={newAssignment.title} onChange={(e) => setNewAssignment({...newAssignment, title: e.target.value})} placeholder="Введите название задания" />
                  </div>

                  <div className="form-group">
                    <label>Описание *</label>
                    <textarea 
                      value={newAssignment.description} 
                      onChange={(e) => setNewAssignment({...newAssignment, description: e.target.value})} 
                      placeholder="Введите описание задания" 
                      rows={5}
                      className="description-textarea"
                    />
                  </div>

                  <div className="form-group">
                    <label>Режим *</label>
                    <div className="checkbox-group">
                      <label className="checkbox-label">
                        <input type="checkbox" checked={newAssignment.modes.length === modeOptions.length} onChange={() => handleModeChange('Все')} />
                        <span>Все</span>
                      </label>
                      {modeOptions.map(mode => (
                        <label key={mode} className="checkbox-label">
                          <input type="checkbox" checked={newAssignment.modes.includes(mode)} onChange={() => handleModeChange(mode)} />
                          <span>{mode}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Погодные условия</label>
                      <select value={newAssignment.weather} onChange={(e) => setNewAssignment({...newAssignment, weather: e.target.value})}>
                        <option value="">Выберите погоду</option>
                        {weatherOptions.map(weather => (<option key={weather} value={weather}>{weather}</option>))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Время суток</label>
                      <select value={newAssignment.timeOfDay} onChange={(e) => setNewAssignment({...newAssignment, timeOfDay: e.target.value})}>
                        <option value="">Выберите время</option>
                        {timeOptions.map(time => (<option key={time} value={time}>{time}</option>))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Кому назначено</label>
                    <div className="radio-group">
                      <label className="radio-label">
                        <input type="radio" name="assignedTo" checked={selectedAssignedType === 'group'} onChange={() => handleAssignedToChange('group')} />
                        <span>Группе</span>
                      </label>
                      <label className="radio-label">
                        <input type="radio" name="assignedTo" checked={selectedAssignedType === 'student'} onChange={() => handleAssignedToChange('student')} />
                        <span>Ученику</span>
                      </label>
                    </div>
                  </div>

                  {selectedAssignedType === 'group' && (
                    <div className="form-group">
                      <label>Выберите группы (можно выбрать несколько)</label>
                      <select multiple value={newAssignment.groups} onChange={handleGroupSelect} className="multi-select">
                        {groupOptions.map(group => (
                          <option key={group} value={group}>{group}</option>
                        ))}
                      </select>
                      <small className="hint">Зажмите Ctrl для выбора нескольких групп</small>
                    </div>
                  )}

                  {selectedAssignedType === 'student' && (
                    <div className="form-group">
                      <label>Выберите учеников (можно выбрать несколько)</label>
                      <select multiple value={newAssignment.students.map(String)} onChange={handleStudentSelect} className="multi-select">
                        {studentsList.map(student => (
                          <option key={student.id} value={student.id}>{`${student.lastName} ${student.firstName} ${student.patronymic}`}</option>
                        ))}
                      </select>
                      <small className="hint">Зажмите Ctrl для выбора нескольких учеников</small>
                    </div>
                  )}

                  <div className="form-group">
                    <label>Неисправности</label>
                    <div className="defects-grid">
                      <div className="defects-column">
                        <h4>Доступные неисправности</h4>
                        {availableDefects.map(defect => (
                          <div key={defect.id} className="defect-item">
                            <span>{defect.name}</span>
                            <button className="add-btn" onClick={() => handleAddDefect(defect)}>+</button>
                          </div>
                        ))}
                      </div>
                      <div className="defects-column">
                        <h4>Выбранные неисправности</h4>
                        {selectedDefects.map(defect => (
                          <div key={defect.id} className="defect-item">
                            <span>{defect.name}</span>
                            <button className="remove-btn" onClick={() => handleRemoveDefect(defect)}>-</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="form-actions">
                  <button className="submit-btn" onClick={handleCreateAssignment}>Создать</button>
                  <button className="reset-btn" onClick={() => setShowCreateForm(false)}>Отмена</button>
                </div>
              </div>
            )}

            {/* Список тем с заданиями */}
            {!showCreateForm && (
              <>
                {getUniqueTopicsWithAssignments().length > 0 ? (
                  <>
                    <div className="topics-list">
                      {getUniqueTopicsWithAssignments().map(topic => (
                        <div key={topic.id} className="topic-item" onClick={() => setSelectedTopic(selectedTopic === topic.name ? null : topic.name)}>
                          <span className="topic-name">{topic.name}</span>
                          <span className="topic-count">{getAssignmentsByTopic(topic.name).length} заданий</span>
                        </div>
                      ))}
                    </div>

                    {selectedTopic && (
                      <div className="assignments-by-topic">
                        <h3>Задания по теме: {selectedTopic}</h3>
                        <div className="assignments-list">
                          {getAssignmentsByTopic(selectedTopic).map(assignment => (
                            <div key={assignment.id} className="assignment-card">
                              <div className="assignment-header">
                                <h4>{assignment.title}</h4>
                                <span className="assignment-date">{assignment.createdAt}</span>
                              </div>
                              <p className="assignment-description">{assignment.description}</p>
                              <div className="assignment-details">
                                <div><strong>Режимы:</strong> {assignment.modes.join(', ') || 'Не выбрано'}</div>
                                <div><strong>Погода:</strong> {assignment.weather || 'Не выбрано'}</div>
                                <div><strong>Время суток:</strong> {assignment.timeOfDay || 'Не выбрано'}</div>
                                <div><strong>Назначено:</strong> {assignment.assignedTo.join(', ') || 'Не выбрано'}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="no-assignments">
                    <p>Нет созданных заданий. Нажмите кнопку "Создать задание" чтобы добавить первое задание.</p>
                  </div>
                )}
              </>
            )}
          </>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div className="teacher-page">
        <div className="teacher-work-area">
          {renderContent()}
        </div>

        <div className="teacher-sidebar">
          <div className="menu-buttons-wrapper">
            <div className="menu-buttons">
              <button className={`menu-btn all-students-btn ${activeTab === 'all-students' ? 'active' : ''}`} onClick={() => setActiveTab('all-students')}>
                <span className="btn-title">Все ученики</span>
                <span className="btn-subtitle">список всех учеников</span>
              </button>
              <button className={`menu-btn registration-btn ${activeTab === 'registration' ? 'active' : ''}`} onClick={() => setActiveTab('registration')}>
                <span className="btn-title">Регистрация</span>
                <span className="btn-subtitle">создание записей пользователей</span>
              </button>
              <button className={`menu-btn management-btn ${activeTab === 'management' ? 'active' : ''}`} onClick={() => setActiveTab('management')}>
                <span className="btn-title">Управление</span>
                <span className="btn-subtitle">управление группами, профессиями и т.д.</span>
              </button>
              <button className={`menu-btn assignments-btn ${activeTab === 'assignments' ? 'active' : ''}`} onClick={() => setActiveTab('assignments')}>
                <span className="btn-title">Задания</span>
                <span className="btn-subtitle">создание и редактирование уроков</span>
              </button>
              <button className="modal-btn cancel-btn" onClick={onBack}>Выход</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TeacherProfile;