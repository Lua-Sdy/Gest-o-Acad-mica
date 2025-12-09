import React from 'react';
import { Outlet, useNavigate, Link as RouterLink } from 'react-router-dom';
import { Box, Drawer, AppBar, Toolbar, List, ListItem, ListItemButton, ListItemIcon, ListItemText, CssBaseline, Typography, IconButton } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SchoolIcon from '@mui/icons-material/School';
import ClassIcon from '@mui/icons-material/Class';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import GridOnIcon from '@mui/icons-material/GridOn';
import ComputerIcon from '@mui/icons-material/Computer';
import GroupsIcon from '@mui/icons-material/Groups';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd'; // Importa o novo ícone
import LogoutIcon from '@mui/icons-material/Logout';

const drawerWidth = 240;

const navItems = [
    { text: 'Home', path: '/home', icon: <HomeIcon /> },
    { text: 'Usuários', path: '/cadastro-usuario', icon: <PersonAddIcon /> },
    { text: 'Cursos', path: '/cadastro-curso', icon: <SchoolIcon /> },
    { text: 'Turmas', path: '/cadastro-turma', icon: <GroupsIcon /> },
    { text: 'Disciplinas', path: '/cadastro-disciplina', icon: <ClassIcon /> },
    { text: 'Salas', path: '/cadastro-sala', icon: <MeetingRoomIcon /> },
    { text: 'Software', path: '/cadastro-software', icon: <ComputerIcon /> },
    { text: 'Alocação', path: '/alocacao-professor', icon: <AssignmentIndIcon /> }, // Adiciona o novo item
    { text: 'Grade', path: '/grade-curricular', icon: <GridOnIcon /> },
];

export function ModernLayout() {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        navigate('/');
    };

    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
                <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h6" noWrap component="div">
                        Gestão Acadêmica
                    </Typography>
                    <IconButton color="inherit" onClick={handleLogout} aria-label="logout">
                        <LogoutIcon />
                    </IconButton>
                </Toolbar>
            </AppBar>
            <Drawer
                variant="permanent"
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
                }}
            >
                <Toolbar />
                <Box sx={{ overflow: 'auto' }}>
                    <List>
                        {navItems.map((item) => (
                            <ListItem key={item.text} disablePadding>
                                <ListItemButton component={RouterLink} to={item.path}>
                                    <ListItemIcon>
                                        {item.icon}
                                    </ListItemIcon>
                                    <ListItemText primary={item.text} />
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                </Box>
            </Drawer>
            <Box component="main" sx={{ flexGrow: 1, p: 3, backgroundColor: '#f4f6f8', minHeight: '100vh' }}>
                <Toolbar />
                <Outlet />
            </Box>
        </Box>
    );
}
