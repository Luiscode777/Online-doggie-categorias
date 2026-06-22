const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const {
  hashPassword,
  verifyPassword,
  createToken
} = require('../src/utils/security');

describe('Security Utils', () => {

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('hashPassword', () => {

    it('debería generar un hash correctamente', async () => {

      const password = 'admin123';

      const hashed = await hashPassword(password);

      expect(hashed).not.toBe(password);

      const match = await bcrypt.compare(password, hashed);

      expect(match).toBe(true);
    });

    it('debería manejar errores de bcrypt.hash', async () => {

      jest
        .spyOn(bcrypt, 'hash')
        .mockRejectedValueOnce(new Error('Hash Error'));

      await expect(
        hashPassword('123456')
      ).rejects.toThrow('Hash Error');
    });

  });

  describe('verifyPassword', () => {

    it('debería validar password correcta', async () => {

      const password = 'admin123';

      const hashed = await bcrypt.hash(password, 10);

      const result = await verifyPassword(
        password,
        hashed
      );

      expect(result).toBe(true);
    });

    it('debería rechazar password incorrecta', async () => {

      const hashed = await bcrypt.hash('correcta', 10);

      const result = await verifyPassword(
        'incorrecta',
        hashed
      );

      expect(result).toBe(false);
    });

    it('debería manejar errores de bcrypt.compare', async () => {

      jest
        .spyOn(bcrypt, 'compare')
        .mockRejectedValueOnce(new Error('Compare Error'));

      await expect(
        verifyPassword('123', 'hash')
      ).rejects.toThrow('Compare Error');
    });

  });

  describe('createToken', () => {

    it('debería generar un JWT válido', () => {

      process.env.JWT_SECRET = 'testsecret';

      const payload = {
        id: 1,
        email: 'admin@gmail.com'
      };

      const token = createToken(payload);

      expect(typeof token).toBe('string');

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
      );

      expect(decoded.id).toBe(payload.id);
      expect(decoded.email).toBe(payload.email);
    });

    it('debería manejar errores de jwt.sign', () => {

      jest
        .spyOn(jwt, 'sign')
        .mockImplementationOnce(() => {
          throw new Error('JWT Error');
        });

      expect(() =>
        createToken({ id: 1 })
      ).toThrow('JWT Error');
    });

  });

});