import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { redirectToSignIn } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import React from "react";

type Props = {};

export default async function InvitePage({
  params,
}: {
  params: { inviteCode: string };
}) {
  const profile = await currentProfile();
  if (!profile) {
    redirectToSignIn();
  }
  if (!params.inviteCode) {
    redirect("/");
  }
  const existingServer = await db.server.findFirst({
    where: {
      inviteCode: params.inviteCode,
      members: {
        some: {
          profileId: profile?.id,
        },
      },
    },
  });

  if (existingServer) {
    return redirect(`/servers/${existingServer.id}`);
  }

  const server = await db.server.update({
    where: {
      inviteCode: params.inviteCode,
    },
    data: {
      members: {
        //@ts-expect-error
        create: [{ profileId: profile?.id }],
      },
    },
  });
  if (server) {
    return redirect(`/servers/${server.id}`);
  }

  return null;
}
