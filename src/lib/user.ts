import db from "./db";
import { cacheTag, cacheLife } from "next/cache";

export type UserProfile = {
  id: string;
  firstname?: string | null;
  lastname?: string | null;
  email: string;
  username: string;
  password?: string | null;
};

export async function getUserProfile(
  userId: string
): Promise<UserProfile | null> {
  "use cache";
  cacheTag(`user-profile-${userId}`);
  cacheLife("minutes");
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      firstname: true,
      lastname: true,
      email: true,
      username: true,
    },
  });

  if (!user) return null;

  return {
    id: user.id,
    firstname: user.firstname,
    lastname: user.lastname,
    email: user.email,
    username: user.username,
  };
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<Omit<UserProfile, "id">>
): Promise<UserProfile | null> {
  // Make sure to omit fields you do not want to allow updating.
  const updatedUser = await db.user.update({
    where: { id: userId },
    data: {
      firstname: updates.firstname ?? undefined,
      lastname: updates.lastname ?? undefined,
      email: updates.email,
      username: updates.username,
    },
    select: {
      id: true,
      firstname: true,
      lastname: true,
      email: true,
      username: true,
    },
  });

  if (!updatedUser) return null;

  return {
    id: updatedUser.id,
    firstname: updatedUser.firstname,
    lastname: updatedUser.lastname,
    email: updatedUser.email,
    username: updatedUser.username,
  };
}
