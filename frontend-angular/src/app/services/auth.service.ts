import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class AuthService {

    private readonly domain =
        'https://tiendaperritos-auth.auth.us-east-1.amazoncognito.com';

    private readonly clientId =
        '60eknr7re3q27nlj181vdmi0cg';

    private readonly redirectUri =
        'http://localhost:4200';

    private readonly scopes =
        'openid email profile';


    async login(): Promise<void> {

        const verifier = this.generarCodigoAleatorio(64);

        const challenge =
            await this.generarChallenge(verifier);

        const state =
            this.generarCodigoAleatorio(32);

        sessionStorage.setItem(
            'tienda_code_verifier',
            verifier
        );

        sessionStorage.setItem(
            'tienda_oauth_state',
            state
        );

        const url =
            `${this.domain}/oauth2/authorize` +
            `?client_id=${encodeURIComponent(this.clientId)}` +
            `&response_type=code` +
            `&scope=${encodeURIComponent(this.scopes)}` +
            `&redirect_uri=${encodeURIComponent(this.redirectUri)}` +
            `&state=${encodeURIComponent(state)}` +
            `&code_challenge_method=S256` +
            `&code_challenge=${encodeURIComponent(challenge)}`;

        window.location.href = url;
    }


    async procesarCallback(): Promise<boolean> {

        const params =
            new URLSearchParams(window.location.search);

        const code =
            params.get('code');

        if (!code) {
            return false;
        }

        const stateRecibido =
            params.get('state');

        const stateGuardado =
            sessionStorage.getItem('tienda_oauth_state');

        const verifier =
            sessionStorage.getItem('tienda_code_verifier');

        if (
            !stateGuardado ||
            !verifier ||
            stateRecibido !== stateGuardado
        ) {
            throw new Error(
                'El estado OAuth no es válido'
            );
        }

        const body =
            new URLSearchParams();

        body.set(
            'grant_type',
            'authorization_code'
        );

        body.set(
            'client_id',
            this.clientId
        );

        body.set(
            'code',
            code
        );

        body.set(
            'redirect_uri',
            this.redirectUri
        );

        body.set(
            'code_verifier',
            verifier
        );

        const response =
            await fetch(
                `${this.domain}/oauth2/token`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type':
                            'application/x-www-form-urlencoded'
                    },
                    body: body.toString()
                }
            );

        if (!response.ok) {

            const detalle =
                await response.text();

            throw new Error(
                `Error obteniendo tokens: ${detalle}`
            );
        }

        const tokens =
            await response.json();

        sessionStorage.setItem(
            'tienda_access_token',
            tokens.access_token
        );

        if (tokens.id_token) {
            sessionStorage.setItem(
                'tienda_id_token',
                tokens.id_token
            );
        }

        sessionStorage.removeItem(
            'tienda_code_verifier'
        );

        sessionStorage.removeItem(
            'tienda_oauth_state'
        );

        return true;
    }


    getAccessToken(): string | null {

        return sessionStorage.getItem(
            'tienda_access_token'
        );
    }


    estaAutenticado(): boolean {

        const token =
            this.getAccessToken();

        if (!token) {
            return false;
        }

        try {

            const payload =
                this.decodificarJwt(token);

            const ahora =
                Math.floor(Date.now() / 1000);

            return payload.exp > ahora;

        } catch {

            return false;
        }
    }


    getGrupos(): string[] {

        const token =
            sessionStorage.getItem('tienda_access_token');

        if (!token) {
            return [];
        }

        try {

            const payloadBase64 =
                token
                    .split('.')[1]
                    .replace(/-/g, '+')
                    .replace(/_/g, '/');

            const payload =
                JSON.parse(
                    atob(payloadBase64)
                );

            console.log(
                'PAYLOAD TOKEN:',
                payload
            );

            console.log(
                'GRUPOS TOKEN:',
                payload['cognito:groups']
            );

            return payload['cognito:groups'] || [];

        } catch (error) {

            console.error(
                'Error leyendo grupos Cognito:',
                error
            );

            return [];
        }
    }


    esAdmin(): boolean {

        const grupos =
            this.getGrupos();

        return grupos.includes('Admin');
    }

    logout(): void {

        sessionStorage.removeItem(
            'tienda_access_token'
        );

        sessionStorage.removeItem(
            'tienda_id_token'
        );

        sessionStorage.removeItem(
            'tienda_code_verifier'
        );

        sessionStorage.removeItem(
            'tienda_oauth_state'
        );

        const logoutUrl =
            `${this.domain}/logout` +
            `?client_id=${encodeURIComponent(this.clientId)}` +
            `&logout_uri=${encodeURIComponent(this.redirectUri)}`;

        window.location.href =
            logoutUrl;
    }


    private generarCodigoAleatorio(
        longitud: number
    ): string {

        const caracteres =
            'ABCDEFGHIJKLMNOPQRSTUVWXYZ' +
            'abcdefghijklmnopqrstuvwxyz' +
            '0123456789-._~';

        const random =
            new Uint8Array(longitud);

        crypto.getRandomValues(random);

        return Array
            .from(random)
            .map(
                numero =>
                    caracteres[
                    numero % caracteres.length
                    ]
            )
            .join('');
    }


    private async generarChallenge(
        verifier: string
    ): Promise<string> {

        const data =
            new TextEncoder()
                .encode(verifier);

        const digest =
            await crypto.subtle.digest(
                'SHA-256',
                data
            );

        return this.base64Url(
            new Uint8Array(digest)
        );
    }


    private base64Url(
        bytes: Uint8Array
    ): string {

        let texto = '';

        bytes.forEach(
            byte =>
                texto += String.fromCharCode(byte)
        );

        return btoa(texto)
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
    }


    private decodificarJwt(
        token: string
    ): any {

        let payload =
            token.split('.')[1]
                .replace(/-/g, '+')
                .replace(/_/g, '/');

        while (
            payload.length % 4 !== 0
        ) {
            payload += '=';
        }

        const binario =
            atob(payload);

        const bytes =
            Uint8Array.from(
                binario,
                caracter =>
                    caracter.charCodeAt(0)
            );

        const json =
            new TextDecoder()
                .decode(bytes);

        return JSON.parse(json);
    }
}