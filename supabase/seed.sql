-- Sample book for development/testing
-- Run after migrations and after creating the books-private storage bucket

INSERT INTO books (slug, title, author, description, long_description, price, pdf_path, language, tags, is_published)
VALUES (
  'libro-de-prueba',
  'Libro de Prueba',
  'Autor de Ejemplo',
  'Un libro de ejemplo para probar el sistema de venta de ebooks.',
  'Este es un libro de prueba para verificar el flujo completo de compra, acceso y descarga con watermark. No contiene contenido real.',
  1500.00,
  'originals/test/book.pdf',
  'es',
  ARRAY['prueba', 'demo'],
  true
);
