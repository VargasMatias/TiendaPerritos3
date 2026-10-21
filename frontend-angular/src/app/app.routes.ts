import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Productos } from './pages/productos/productos';

export const routes: Routes = [
    {
        path: '',
        component: Login
    },
    {
        path: 'login',
        component: Login
    },
    {
        path: 'productos',
        component: Productos
    },
    {
        path: '**',
        redirectTo: ''
    }
];