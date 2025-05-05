export const basicInfoSelect = {
  id: true,
  name: true,
  avatar: true,
  bio: true,
  gender: true,
  birthday: true,
  createdAt: true,
};

export const fullInfoSelect = {
  ...basicInfoSelect,
  email: true,
  role: true,
};
