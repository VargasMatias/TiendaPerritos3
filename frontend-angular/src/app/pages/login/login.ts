import {
  Component,
  OnInit
} from '@angular/core';

import { Router } from '@angular/router';

import {
  AuthService
} from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login implements OnInit {

  procesando = false;

  error = '';


  constructor(
    private authService: AuthService,
    private router: Router
  ) {
  }


  async ngOnInit(): Promise<void> {

    if (
      this.authService.estaAutenticado()
    ) {

      await this.router.navigateByUrl(
        '/productos',
        {
          replaceUrl: true
        }
      );

      return;
    }


    const params =
      new URLSearchParams(
        window.location.search
      );

    if (params.has('code')) {

      this.procesando = true;

      try {

        const correcto =
          await this.authService
            .procesarCallback();

        if (correcto) {

          await this.router.navigateByUrl(
            '/productos',
            {
              replaceUrl: true
            }
          );
        }

      } catch (e) {

        console.error(e);

        this.error =
          'No fue posible completar el inicio de sesión.';

      } finally {

        this.procesando = false;
      }
    }
  }


  async iniciarSesion(): Promise<void> {

    this.error = '';

    await this.authService.login();
  }
}