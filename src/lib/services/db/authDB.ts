"use server";
import prisma from "./prisma";

export async function loginUser(email: string, password: string) {
  return await prisma.user.findFirst({
    where: {
      email: email,
      password: password,
    },
  });
}
