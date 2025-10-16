import { Image } from 'src/domain/value-objects/Image';
import { EmptyValueError } from 'src/domain/errors/value-objects/EmptyValueError';
import { InvalidFormatError } from 'src/domain/errors/value-objects/InvalidFormatError';

describe('Image Value Object', () => {
  it('should create a valid image URL', () => {
    const url = 'https://example.com/image.jpg';
    const image = new Image(url);
    expect(image.toString()).toBe(url);
  });

  it('should throw EmptyValueError if URL is empty', () => {
    expect(() => new Image('')).toThrow(EmptyValueError);
    expect(() => new Image('')).toThrow('Image is required');
  });

  it('should throw InvalidFormatError if URL is invalid', () => {
    expect(() => new Image('not-a-url')).toThrow(InvalidFormatError);
    expect(() => new Image('not-a-url')).toThrow('Url not valid');
  });

  it('should throw InvalidFormatError if URL is missing protocol', () => {
    expect(() => new Image('www.example.com/image.jpg')).toThrow(InvalidFormatError);
  });

  it('should compare equality correctly', () => {
    const a = new Image('https://example.com/image.jpg');
    const b = new Image('https://example.com/image.jpg');
    expect(a.equals(b)).toBe(true);
  });

  it('should not be equal to a different URL', () => {
    const a = new Image('https://example.com/image1.jpg');
    const b = new Image('https://example.com/image2.jpg');
    expect(a.equals(b)).toBe(false);
  });
});
