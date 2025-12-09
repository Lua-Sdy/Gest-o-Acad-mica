import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const useAuth = () => {
    const token = localStorage.getItem('authToken');
    // Se o token existir e não estiver vazio, o usuário está autenticado.
    return token ? true : false;
};

export function PrivateRoute() {
    const isAuth = useAuth();
    return isAuth ? <Outlet /> : <Navigate to="/" />;
}