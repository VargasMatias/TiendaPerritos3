package cl.duoc.tiendaperritos.product_service.config;

import org.springframework.amqp.core.AmqpAdmin;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitAdmin;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitConfig {

    // =========================================================
    // EXCHANGES
    // =========================================================

    @Value("${app.rabbit.exchanges.direct}")
    private String directExchangeName;

    @Value("${app.rabbit.exchanges.topic}")
    private String topicExchangeName;

    @Value("${app.rabbit.exchanges.dlx}")
    private String deadLetterExchangeName;


    // =========================================================
    // COLAS PRINCIPALES
    // =========================================================

    @Value("${app.rabbit.queues.notifications}")
    private String notificationsQueueName;

    @Value("${app.rabbit.queues.audit}")
    private String auditQueueName;

    @Value("${app.rabbit.queues.documents}")
    private String documentsQueueName;


    // =========================================================
    // DEAD LETTER QUEUES
    // =========================================================

    @Value("${app.rabbit.queues.notifications-dlq}")
    private String notificationsDlqName;

    @Value("${app.rabbit.queues.audit-dlq}")
    private String auditDlqName;

    @Value("${app.rabbit.queues.documents-dlq}")
    private String documentsDlqName;


    // =========================================================
    // ROUTING KEYS
    // =========================================================

    @Value("${app.rabbit.routing-keys.notification}")
    private String notificationRoutingKey;

    @Value("${app.rabbit.routing-keys.audit}")
    private String auditRoutingKey;

    @Value("${app.rabbit.routing-keys.document}")
    private String documentRoutingKey;

    @Value("${app.rabbit.routing-keys.notifications-dead}")
    private String notificationsDeadRoutingKey;

    @Value("${app.rabbit.routing-keys.audit-dead}")
    private String auditDeadRoutingKey;

    @Value("${app.rabbit.routing-keys.documents-dead}")
    private String documentsDeadRoutingKey;


    // =========================================================
    // RABBIT ADMIN
    // =========================================================

    @Bean
    public AmqpAdmin amqpAdmin(ConnectionFactory connectionFactory) {

        RabbitAdmin rabbitAdmin = new RabbitAdmin(connectionFactory);
        rabbitAdmin.setAutoStartup(true);

        return rabbitAdmin;
    }


    // =========================================================
    // EXCHANGES
    // =========================================================

    @Bean
    public DirectExchange productosDirectExchange() {

        return new DirectExchange(
                directExchangeName,
                true,
                false
        );
    }

    @Bean
    public TopicExchange productosTopicExchange() {

        return new TopicExchange(
                topicExchangeName,
                true,
                false
        );
    }

    @Bean
    public DirectExchange productosDeadLetterExchange() {

        return new DirectExchange(
                deadLetterExchangeName,
                true,
                false
        );
    }


    // =========================================================
    // COLAS PRINCIPALES
    // =========================================================

    @Bean
    public Queue notificationsQueue() {

        return QueueBuilder
                .durable(notificationsQueueName)
                .deadLetterExchange(deadLetterExchangeName)
                .deadLetterRoutingKey(notificationsDeadRoutingKey)
                .build();
    }

    @Bean
    public Queue auditQueue() {

        return QueueBuilder
                .durable(auditQueueName)
                .deadLetterExchange(deadLetterExchangeName)
                .deadLetterRoutingKey(auditDeadRoutingKey)
                .build();
    }

    @Bean
    public Queue documentsQueue() {

        return QueueBuilder
                .durable(documentsQueueName)
                .deadLetterExchange(deadLetterExchangeName)
                .deadLetterRoutingKey(documentsDeadRoutingKey)
                .build();
    }


    // =========================================================
    // DEAD LETTER QUEUES
    // =========================================================

    @Bean
    public Queue notificationsDlq() {

        return QueueBuilder
                .durable(notificationsDlqName)
                .build();
    }

    @Bean
    public Queue auditDlq() {

        return QueueBuilder
                .durable(auditDlqName)
                .build();
    }

    @Bean
    public Queue documentsDlq() {

        return QueueBuilder
                .durable(documentsDlqName)
                .build();
    }


    // =========================================================
    // BINDINGS PRINCIPALES
    // =========================================================

    @Bean
    public Binding notificationsBinding(
            @Qualifier("notificationsQueue")
            Queue notificationsQueue,

            @Qualifier("productosDirectExchange")
            DirectExchange productosDirectExchange) {

        return BindingBuilder
                .bind(notificationsQueue)
                .to(productosDirectExchange)
                .with(notificationRoutingKey);
    }

    @Bean
    public Binding auditBinding(
            @Qualifier("auditQueue")
            Queue auditQueue,

            @Qualifier("productosTopicExchange")
            TopicExchange productosTopicExchange) {

        return BindingBuilder
                .bind(auditQueue)
                .to(productosTopicExchange)
                .with(auditRoutingKey);
    }

    @Bean
    public Binding documentsBinding(
            @Qualifier("documentsQueue")
            Queue documentsQueue,

            @Qualifier("productosDirectExchange")
            DirectExchange productosDirectExchange) {

        return BindingBuilder
                .bind(documentsQueue)
                .to(productosDirectExchange)
                .with(documentRoutingKey);
    }


    // =========================================================
    // BINDINGS DE LAS DLQ
    // =========================================================

    @Bean
    public Binding notificationsDlqBinding(
            @Qualifier("notificationsDlq")
            Queue notificationsDlq,

            @Qualifier("productosDeadLetterExchange")
            DirectExchange productosDeadLetterExchange) {

        return BindingBuilder
                .bind(notificationsDlq)
                .to(productosDeadLetterExchange)
                .with(notificationsDeadRoutingKey);
    }

    @Bean
    public Binding auditDlqBinding(
            @Qualifier("auditDlq")
            Queue auditDlq,

            @Qualifier("productosDeadLetterExchange")
            DirectExchange productosDeadLetterExchange) {

        return BindingBuilder
                .bind(auditDlq)
                .to(productosDeadLetterExchange)
                .with(auditDeadRoutingKey);
    }

    @Bean
    public Binding documentsDlqBinding(
            @Qualifier("documentsDlq")
            Queue documentsDlq,

            @Qualifier("productosDeadLetterExchange")
            DirectExchange productosDeadLetterExchange) {

        return BindingBuilder
                .bind(documentsDlq)
                .to(productosDeadLetterExchange)
                .with(documentsDeadRoutingKey);
    }


    // =========================================================
    // DECLARACIÓN EXPLÍCITA AL INICIAR SPRING
    // =========================================================

    @Bean
    public ApplicationRunner declararInfraestructuraRabbit(
            AmqpAdmin admin,

            @Qualifier("productosDirectExchange")
            DirectExchange productosDirectExchange,

            @Qualifier("productosTopicExchange")
            TopicExchange productosTopicExchange,

            @Qualifier("productosDeadLetterExchange")
            DirectExchange productosDeadLetterExchange,

            @Qualifier("notificationsQueue")
            Queue notificationsQueue,

            @Qualifier("auditQueue")
            Queue auditQueue,

            @Qualifier("documentsQueue")
            Queue documentsQueue,

            @Qualifier("notificationsDlq")
            Queue notificationsDlq,

            @Qualifier("auditDlq")
            Queue auditDlq,

            @Qualifier("documentsDlq")
            Queue documentsDlq,

            @Qualifier("notificationsBinding")
            Binding notificationsBinding,

            @Qualifier("auditBinding")
            Binding auditBinding,

            @Qualifier("documentsBinding")
            Binding documentsBinding,

            @Qualifier("notificationsDlqBinding")
            Binding notificationsDlqBinding,

            @Qualifier("auditDlqBinding")
            Binding auditDlqBinding,

            @Qualifier("documentsDlqBinding")
            Binding documentsDlqBinding) {

        return args -> {

            System.out.println(
                    "=== Declarando infraestructura RabbitMQ ==="
            );

            // Exchanges
            admin.declareExchange(productosDirectExchange);
            admin.declareExchange(productosTopicExchange);
            admin.declareExchange(productosDeadLetterExchange);

            // Colas principales
            admin.declareQueue(notificationsQueue);
            admin.declareQueue(auditQueue);
            admin.declareQueue(documentsQueue);

            // Dead Letter Queues
            admin.declareQueue(notificationsDlq);
            admin.declareQueue(auditDlq);
            admin.declareQueue(documentsDlq);

            // Bindings principales
            admin.declareBinding(notificationsBinding);
            admin.declareBinding(auditBinding);
            admin.declareBinding(documentsBinding);

            // Bindings DLQ
            admin.declareBinding(notificationsDlqBinding);
            admin.declareBinding(auditDlqBinding);
            admin.declareBinding(documentsDlqBinding);

            System.out.println(
                    "=== Infraestructura RabbitMQ declarada correctamente ==="
            );
        };
    }

}