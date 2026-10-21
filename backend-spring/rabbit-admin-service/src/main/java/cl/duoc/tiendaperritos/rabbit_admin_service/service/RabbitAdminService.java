package cl.duoc.tiendaperritos.rabbit_admin_service.service;

import cl.duoc.tiendaperritos.rabbit_admin_service.dto.BindingRequest;
import cl.duoc.tiendaperritos.rabbit_admin_service.dto.ExchangeRequest;
import cl.duoc.tiendaperritos.rabbit_admin_service.dto.QueueRequest;

import org.springframework.amqp.core.AmqpAdmin;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.FanoutExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.stereotype.Service;

@Service
public class RabbitAdminService {

    private final AmqpAdmin amqpAdmin;

    public RabbitAdminService(AmqpAdmin amqpAdmin) {
        this.amqpAdmin = amqpAdmin;
    }


    public void crearQueue(QueueRequest request) {

        Queue queue = new Queue(
                request.name(),
                true
        );

        amqpAdmin.declareQueue(queue);

        System.out.println(
                "[RABBIT ADMIN] Queue creada: "
                        + request.name()
        );
    }


    public boolean eliminarQueue(String nombre) {

        boolean eliminada =
                amqpAdmin.deleteQueue(nombre);

        System.out.println(
                "[RABBIT ADMIN] Queue eliminada: "
                        + nombre
                        + " -> "
                        + eliminada
        );

        return eliminada;
    }


    public void crearExchange(ExchangeRequest request) {

        switch (request.type().toLowerCase()) {

            case "direct" ->
                    amqpAdmin.declareExchange(
                            new DirectExchange(
                                    request.name(),
                                    true,
                                    false
                            )
                    );

            case "topic" ->
                    amqpAdmin.declareExchange(
                            new TopicExchange(
                                    request.name(),
                                    true,
                                    false
                            )
                    );

            case "fanout" ->
                    amqpAdmin.declareExchange(
                            new FanoutExchange(
                                    request.name(),
                                    true,
                                    false
                            )
                    );

            default ->
                    throw new IllegalArgumentException(
                            "Tipo de exchange no soportado"
                    );
        }

        System.out.println(
                "[RABBIT ADMIN] Exchange creado: "
                        + request.name()
                        + " tipo="
                        + request.type()
        );
    }


    public boolean eliminarExchange(String nombre) {

        boolean eliminado =
                amqpAdmin.deleteExchange(nombre);

        System.out.println(
                "[RABBIT ADMIN] Exchange eliminado: "
                        + nombre
                        + " -> "
                        + eliminado
        );

        return eliminado;
    }


    public void crearBinding(BindingRequest request) {

        Queue queue =
                new Queue(
                        request.queue(),
                        true
                );

        DirectExchange exchange =
                new DirectExchange(
                        request.exchange(),
                        true,
                        false
                );

        Binding binding =
                BindingBuilder
                        .bind(queue)
                        .to(exchange)
                        .with(request.routingKey());

        amqpAdmin.declareBinding(binding);

        System.out.println(
                "[RABBIT ADMIN] Binding creado: "
                        + request.exchange()
                        + " -> "
                        + request.queue()
                        + " routingKey="
                        + request.routingKey()
        );
    }
}