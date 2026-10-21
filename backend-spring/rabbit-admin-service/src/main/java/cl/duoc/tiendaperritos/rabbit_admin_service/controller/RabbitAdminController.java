package cl.duoc.tiendaperritos.rabbit_admin_service.controller;

import cl.duoc.tiendaperritos.rabbit_admin_service.dto.BindingRequest;
import cl.duoc.tiendaperritos.rabbit_admin_service.dto.ExchangeRequest;
import cl.duoc.tiendaperritos.rabbit_admin_service.dto.QueueRequest;
import cl.duoc.tiendaperritos.rabbit_admin_service.service.RabbitAdminService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/rabbit")
public class RabbitAdminController {

    private final RabbitAdminService rabbitAdminService;

    public RabbitAdminController(
            RabbitAdminService rabbitAdminService) {

        this.rabbitAdminService =
                rabbitAdminService;
    }


    @PostMapping("/queues")
    public ResponseEntity<?> crearQueue(
            @Valid @RequestBody QueueRequest request) {

        rabbitAdminService.crearQueue(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        Map.of(
                                "mensaje",
                                "Queue creada correctamente",
                                "queue",
                                request.name()
                        )
                );
    }


    @DeleteMapping("/queues/{nombre}")
    public ResponseEntity<?> eliminarQueue(
            @PathVariable String nombre) {

        boolean eliminada =
                rabbitAdminService.eliminarQueue(nombre);

        return ResponseEntity.ok(
                Map.of(
                        "mensaje",
                        "Solicitud de eliminación procesada",
                        "queue",
                        nombre,
                        "eliminada",
                        eliminada
                )
        );
    }


    @PostMapping("/exchanges")
    public ResponseEntity<?> crearExchange(
            @Valid @RequestBody ExchangeRequest request) {

        rabbitAdminService.crearExchange(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        Map.of(
                                "mensaje",
                                "Exchange creado correctamente",
                                "exchange",
                                request.name(),
                                "tipo",
                                request.type()
                        )
                );
    }


    @DeleteMapping("/exchanges/{nombre}")
    public ResponseEntity<?> eliminarExchange(
            @PathVariable String nombre) {

        boolean eliminado =
                rabbitAdminService.eliminarExchange(nombre);

        return ResponseEntity.ok(
                Map.of(
                        "mensaje",
                        "Solicitud de eliminación procesada",
                        "exchange",
                        nombre,
                        "eliminado",
                        eliminado
                )
        );
    }


    @PostMapping("/bindings")
    public ResponseEntity<?> crearBinding(
            @Valid @RequestBody BindingRequest request) {

        rabbitAdminService.crearBinding(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        Map.of(
                                "mensaje",
                                "Binding creado correctamente",
                                "exchange",
                                request.exchange(),
                                "queue",
                                request.queue(),
                                "routingKey",
                                request.routingKey()
                        )
                );
    }
}