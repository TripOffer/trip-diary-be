import { Faker, simpleFaker, zh_CN, en } from '@faker-js/faker'; // 导入 en 语言包
import { PrismaClient } from '@prisma/client';

// 将 en 添加到 locale 数组作为备用语言包
const faker = new Faker({ locale: [zh_CN, en] });

const prisma = new PrismaClient();

async function main() {
  const users = Array.from({ length: 10 }).map(() => ({
    name: faker.person.fullName(),
    email: faker.internet.email({ provider: 'example.com' }),
    password: faker.internet.password({ length: 12 }),
    bio: faker.lorem.paragraph(),
    avatar: faker.image.avatar(),
  }));

  await prisma.user.createMany({
    data: users,
  });

  // 获取已创建用户的 ID
  const createdUsers = await prisma.user.findMany({
    select: { id: true },
  });
  const userIds = createdUsers.map((user) => user.id);

  // 生成 Diary 数据
  const diaries = Array.from({ length: 50 }).map(() => {
    const title = faker.lorem.sentence(5);
    const contentParagraphs = faker.lorem.paragraphs(3);
    return {
      authorId: faker.helpers.arrayElement(userIds),
      slug: simpleFaker.helpers.slugify(faker.lorem.words(5)).toLowerCase(),
      title: title,
      content: contentParagraphs,
      thumbnail: faker.image.urlLoremFlickr({ category: 'travel' }),
      images: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }).map(
        () => faker.image.urlLoremFlickr({ category: 'nature' }),
      ),
      published: faker.datatype.boolean(0.8),
      publishedAt: faker.date.past(),
      status: faker.helpers.arrayElement(['Approved', 'Pending', 'Rejected']),
    };
  });

  await prisma.diary.createMany({
    data: diaries,
  });

  console.log(
    'Seed data created successfully with Chinese locale (fallback to English)!',
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
