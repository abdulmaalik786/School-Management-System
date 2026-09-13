import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

// Chunk 2 Pages
import Students from './pages/Students';
import Teachers from './pages/Teachers';
import Parents from './pages/Parents';
import AcademicYears from './pages/AcademicYears';
import ClassesSections from './pages/ClassesSections';
import Subjects from './pages/Subjects';

// Chunk 3 Pages
import Periods from './pages/Periods';
import Timetable from './pages/Timetable';
import StudentAttendance from './pages/StudentAttendance';
import AttendanceReports from './pages/AttendanceReports';
import TeacherAttendance from './pages/TeacherAttendance';

// Chunk 4 Pages
import Exams from './pages/Exams';
import MarksEntry from './pages/MarksEntry';
import Results from './pages/Results';
import FeeManagement from './pages/FeeManagement';

// Chunk 5 Real Pages
import Assignments from './pages/Assignments';
import Library from './pages/Library';
import Transport from './pages/Transport';
import EventsCalendar from './pages/EventsCalendar';
import Announcements from './pages/Announcements';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

import Admissions from './pages/Admissions';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes (Accessible WITHOUT Login) */}
          <Route path="/admissions" element={<Admissions />} />
          <Route path="/login" element={<Login />} />

          {/* Protected Dashboard Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />

              {/* Academic & People Management */}
              <Route path="/students" element={<Students />} />
              <Route path="/teachers" element={<Teachers />} />
              <Route path="/parents" element={<Parents />} />
              <Route path="/academic-years" element={<AcademicYears />} />
              <Route path="/classes" element={<ClassesSections />} />
              <Route path="/subjects" element={<Subjects />} />

              {/* Timetable & Attendance */}
              <Route path="/periods" element={<Periods />} />
              <Route path="/timetable" element={<Timetable />} />
              <Route path="/attendance" element={<StudentAttendance />} />
              <Route path="/attendance-reports" element={<AttendanceReports />} />
              <Route path="/teacher-attendance" element={<TeacherAttendance />} />

              {/* Examination, Results & Fee Management */}
              <Route path="/exams" element={<Exams />} />
              <Route path="/marks-entry" element={<MarksEntry />} />
              <Route path="/results" element={<Results />} />
              <Route path="/fees" element={<FeeManagement />} />

              {/* Extended Modules */}
              <Route path="/assignments" element={<Assignments />} />
              <Route path="/library" element={<Library />} />
              <Route path="/transport" element={<Transport />} />
              <Route path="/calendar" element={<EventsCalendar />} />
              <Route path="/announcements" element={<Announcements />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Route>

          {/* Fallback Catch-all Route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
