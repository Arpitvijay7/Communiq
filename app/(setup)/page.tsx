import React from "react";
import { initialProfile } from "@/lib/initial-Profile";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import InitialModal from "@/components/modals/initial-modal";
type Props = {};

export default async function SetupPage({}: Props) {
  const profile = await initialProfile();
  const server = await db.server.findFirst({
    where: {
      members: {
        some: {
          profileId: profile.id,
        },
      },
    },
  });

  if (server) {
    return redirect(`/servers/${server.id}`);
  }
  return (
    <div>
      <InitialModal />
    </div>
  );
}
