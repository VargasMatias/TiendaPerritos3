package cl.duoc.tiendaperritos.productservice.repository;

import cl.duoc.tiendaperritos.productservice.model.Producto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductoRepository extends JpaRepository<Producto, Integer> {
}