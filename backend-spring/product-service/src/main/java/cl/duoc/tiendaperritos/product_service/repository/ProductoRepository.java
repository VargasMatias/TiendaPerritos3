package cl.duoc.tiendaperritos.product_service.repository;

import cl.duoc.tiendaperritos.product_service.model.Producto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductoRepository extends JpaRepository<Producto, Integer> {
}