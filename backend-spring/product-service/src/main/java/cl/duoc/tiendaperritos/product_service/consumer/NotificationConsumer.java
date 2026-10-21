package cl.duoc.tiendaperritos.product_service.consumer;

import com.rabbitmq.client.Channel;

import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Component
public class NotificationConsumer {

    @RabbitListener(queues = "${app.rabbit.queues.notifications}")
    public void consumir(
            Message message,
            Channel channel) throws IOException {

        long deliveryTag =
                message.getMessageProperties().getDeliveryTag();

        String contenido =
                new String(
                        message.getBody(),
                        StandardCharsets.UTF_8
                );

        try {

            System.out.println(
                    "[NOTIFICATIONS] Mensaje recibido: "
                            + contenido
            );

            /*
             * Error controlado para demostrar
             * NACK + Dead Letter Queue.
             */
            if (contenido.contains("ERROR_DLQ")) {

                throw new RuntimeException(
                        "Error intencional para prueba de DLQ"
                );
            }

            channel.basicAck(
                    deliveryTag,
                    false
            );

            System.out.println(
                    "[NOTIFICATIONS] ACK enviado correctamente"
            );

        } catch (Exception e) {

            System.err.println(
                    "[NOTIFICATIONS] ERROR procesando mensaje: "
                            + e.getMessage()
            );

            /*
             * requeue = false
             * El mensaje NO vuelve a notifications.queue.
             * RabbitMQ lo envía al Dead Letter Exchange.
             */
            channel.basicNack(
                    deliveryTag,
                    false,
                    false
            );

            System.err.println(
                    "[NOTIFICATIONS] NACK enviado - requeue=false"
            );
        }
    }
}