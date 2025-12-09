import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import './index.css';
// import { DataProvider } from './context/DataContext'; // REMOVIDO

// Páginas
import { LoginPage } from './pages/Login';
import { HomePage } from './pages/Home';
import { CadastroUsuarioPage } from './pages/CadastroUsuario';
import { CadastroCursoPage } from './pages/CadastroCurso';
import { CadastroDisciplinaPage } from './pages/CadastroDisciplina';
import { CadastroSalaPage } from './pages/CadastroSala';
import { GradeCurricularPage } from './pages/GradeCurricular';
import { CadastroSoftwarePage } from './pages/CadastroSoftware';
import { CadastroTurmaPage } from './pages/CadastroTurma';
import { AlocacaoProfessorPage } from './pages/AlocacaoProfessor';

// Componentes de Layout e Rota
import { ModernLayout } from './components/ModernLayout';
import { PrivateRoute } from './components/PrivateRoute';

const router = createBrowserRouter([
  {
    path: "/",
    element: <LoginPage />,
  },
  {
    path: "/cadastro-usuario",
    element: <CadastroUsuarioPage />,
  },
  {
    path: "/",
    element: <PrivateRoute />,
    children: [
      {
        path: "/",
        element: <ModernLayout />,
        children: [
          {
            path: "/home",
            element: <HomePage />,
          },
          {
            path: "/cadastro-curso",
            element: <CadastroCursoPage />,
          },
          {
            path: "/cadastro-disciplina",
            element: <CadastroDisciplinaPage />,
          },
          {
            path: "/cadastro-sala",
            element: <CadastroSalaPage />,
          },
          {
            path: "/grade-curricular",
            element: <GradeCurricularPage />,
          },
          {
            path: "/cadastro-software",
            element: <CadastroSoftwarePage />,
          },
          {
            path: "/cadastro-turma",
            element: <CadastroTurmaPage />,
          },
          {
            path: "/alocacao-professor",
            element: <AlocacaoProfessorPage />,
          }
        ]
      }
    ]
  }
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* <DataProvider> REMOVIDO */}
      <RouterProvider router={router} />
    {/* </DataProvider> REMOVIDO */}
  </React.StrictMode>,
);
