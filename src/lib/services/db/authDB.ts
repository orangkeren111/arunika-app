"use server";
import prisma from "./prisma";

export async function getUserByEmail(email: string) {
  return await prisma.user.findFirst({
    where: {
      email: email,
    },
    include: {
      sekolah: true,
    },
  });
}

export async function loginUser(email: string) {
  return await getUserByEmail(email);
}
