import { ValidationPipe } from '@nestjs/common';
import { CreateQuackDto } from './create-quack.dto';

// Same options as the controller's pipe, so this is what a request goes through.
const pipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
});

const validate = (body: unknown): Promise<unknown> =>
  pipe.transform(body, { type: 'body', metatype: CreateQuackDto });

describe('CreateQuackDto', () => {
  it('accepts a quack without a poll', async () => {
    await expect(validate({ text: 'hello' })).resolves.toEqual({
      text: 'hello',
    });
  });

  it('accepts a poll with trimmed options', async () => {
    const dto = (await validate({
      text: 'Lunch?',
      poll: { options: [' Pizza ', 'Sushi'] },
    })) as CreateQuackDto;
    expect(dto.poll?.options).toEqual(['Pizza', 'Sushi']);
  });

  it.each([
    ['one option', ['Pizza']],
    ['five options', ['a', 'b', 'c', 'd', 'e']],
    ['a blank option', ['Pizza', '   ']],
    ['a too long option', ['Pizza', 'x'.repeat(51)]],
    ['duplicate options', ['Pizza', 'pizza ']],
  ])('rejects a poll with %s', async (_, options) => {
    await expect(
      validate({ text: 'Lunch?', poll: { options } }),
    ).rejects.toThrow();
  });
});
