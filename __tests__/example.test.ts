describe('Pruebas de ejemplo', () => {
  it('debería sumar correctamente dos números', () => {
    const suma = (a: number, b: number) => a + b;
    expect(suma(2, 3)).toBe(5);
  });

  it('debería verificar que una cadena contiene un texto', () => {
    const texto = 'Hola mundo';
    expect(texto).toContain('mundo');
  });

  it('debería comprobar que un array contiene un elemento', () => {
    const lista = [1, 2, 3, 4];
    expect(lista).toContain(3);
  });

  it('debería lanzar un error cuando se divide por cero', () => {
    const dividir = (a: number, b: number) => {
      if (b === 0) throw new Error('No se puede dividir por cero');
      return a / b;
    };
    expect(() => dividir(10, 0)).toThrow('No se puede dividir por cero');
  });
});
