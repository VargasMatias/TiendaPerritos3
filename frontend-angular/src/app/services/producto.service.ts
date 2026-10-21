import { Injectable } from '@angular/core';

import {
    AuthService
} from './auth.service';


export interface Producto {

    id?: number;
    nombre: string;
    descripcion: string;
    precio: number;
    stock: number;

}


@Injectable({
    providedIn: 'root'
})
export class ProductoService {

    private readonly apiUrl =
        'http://localhost:8080/api/productos';


    constructor(
        private authService: AuthService
    ) {
    }


    async listar(): Promise<Producto[]> {

        const response =
            await fetch(
                this.apiUrl,
                {
                    method: 'GET',
                    headers: this.crearHeaders()
                }
            );

        if (!response.ok) {
            throw new Error(
                `Error HTTP ${response.status}`
            );
        }

        return await response.json();
    }


    async crear(
        producto: Producto
    ): Promise<Producto> {

        const response =
            await fetch(
                this.apiUrl,
                {
                    method: 'POST',
                    headers: this.crearHeadersJson(),
                    body: JSON.stringify(producto)
                }
            );

        if (!response.ok) {
            throw new Error(
                `Error HTTP ${response.status}`
            );
        }

        return await response.json();
    }


    async actualizar(
        id: number,
        producto: Producto
    ): Promise<Producto> {

        const response =
            await fetch(
                `${this.apiUrl}/${id}`,
                {
                    method: 'PUT',
                    headers: this.crearHeadersJson(),
                    body: JSON.stringify(producto)
                }
            );

        if (!response.ok) {
            throw new Error(
                `Error HTTP ${response.status}`
            );
        }

        return await response.json();
    }


    async eliminar(
        id: number
    ): Promise<void> {

        const response =
            await fetch(
                `${this.apiUrl}/${id}`,
                {
                    method: 'DELETE',
                    headers: this.crearHeaders()
                }
            );

        if (!response.ok) {
            throw new Error(
                `Error HTTP ${response.status}`
            );
        }
    }


    private crearHeaders(): HeadersInit {

        const token =
            this.authService.getAccessToken();

        if (!token) {
            throw new Error(
                'No existe token de acceso'
            );
        }

        return {
            'Authorization':
                `Bearer ${token}`
        };
    }


    private crearHeadersJson(): HeadersInit {

        return {
            ...this.crearHeaders(),
            'Content-Type':
                'application/json'
        };
    }
}