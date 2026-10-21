import {
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';

import {
  FormsModule
} from '@angular/forms';

import { Router } from '@angular/router';

import {
  Producto,
  ProductoService
} from '../../services/producto.service';

import {
  AuthService
} from '../../services/auth.service';


@Component({
  selector: 'app-productos',
  imports: [
    FormsModule
  ],
  templateUrl: './productos.html',
  styleUrl: './productos.css'
})
export class Productos implements OnInit {

  productos: Producto[] = [];

  cargando = true;

  error = '';

  mensaje = '';

  esAdmin = false;

  editandoId: number | null = null;


  nuevoProducto: Producto = {
    nombre: '',
    descripcion: '',
    precio: 0,
    stock: 0
  };


  productoEditando: Producto = {
    nombre: '',
    descripcion: '',
    precio: 0,
    stock: 0
  };


  constructor(
    private productoService: ProductoService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
  }


  ngOnInit(): void {

    if (!this.authService.estaAutenticado()) {

      this.router.navigateByUrl('/');

      return;
    }

    this.esAdmin =
      this.authService.esAdmin();

    this.cargarProductos();
  }


  async cargarProductos(): Promise<void> {

    this.cargando = true;
    this.error = '';

    try {

      this.productos =
        await this.productoService.listar();

    } catch (error) {

      console.error(error);

      this.error =
        'No fue posible cargar los productos.';

    } finally {

      this.cargando = false;

      this.cdr.detectChanges();
    }
  }


  async crearProducto(): Promise<void> {

    this.mensaje = '';
    this.error = '';

    try {

      await this.productoService
        .crear(this.nuevoProducto);

      this.nuevoProducto = {
        nombre: '',
        descripcion: '',
        precio: 0,
        stock: 0
      };

      this.mensaje =
        'Producto creado correctamente.';

      await this.cargarProductos();

    } catch (error) {

      console.error(error);

      this.error =
        'No fue posible crear el producto.';
    }

    this.cdr.detectChanges();
  }


  comenzarEdicion(
    producto: Producto
  ): void {

    this.editandoId =
      producto.id ?? null;

    this.productoEditando = {
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precio: producto.precio,
      stock: producto.stock
    };
  }


  cancelarEdicion(): void {

    this.editandoId = null;
  }


  async guardarEdicion(
    id: number
  ): Promise<void> {

    this.mensaje = '';
    this.error = '';

    try {

      await this.productoService
        .actualizar(
          id,
          this.productoEditando
        );

      this.editandoId = null;

      this.mensaje =
        'Producto actualizado correctamente.';

      await this.cargarProductos();

    } catch (error) {

      console.error(error);

      this.error =
        'No fue posible actualizar el producto.';
    }

    this.cdr.detectChanges();
  }


  async eliminarProducto(
    producto: Producto
  ): Promise<void> {

    if (!producto.id) {
      return;
    }

    const confirmar =
      window.confirm(
        `¿Eliminar "${producto.nombre}"?`
      );

    if (!confirmar) {
      return;
    }

    this.mensaje = '';
    this.error = '';

    try {

      await this.productoService
        .eliminar(producto.id);

      this.mensaje =
        'Producto eliminado correctamente.';

      await this.cargarProductos();

    } catch (error) {

      console.error(error);

      this.error =
        'No fue posible eliminar el producto.';
    }

    this.cdr.detectChanges();
  }


  cerrarSesion(): void {

    this.authService.logout();
  }
}