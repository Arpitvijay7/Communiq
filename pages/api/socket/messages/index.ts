import { currentProfilePages } from "@/lib/current-profile-pages";
import { db } from "@/lib/db";
import { NextApiResponseServerIo } from "@/types";
import { NextApiRequest } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponseServerIo
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const profile = await currentProfilePages(req);
    const { content, fileUrl } = req.body;
    const { serverId, channelId } = req.query;

    if (!profile) {
      res.status(401).json({ error: "Unauthorized" });
    }
    if (!serverId) {
      res.status(400).json({ error: "Server Id Missing" });
    }
    if (!channelId) {
      res.status(400).json({ error: "Channel Id Missing" });
    }
    if (!content) {
      res.status(400).json({ error: "Content Missing" });
    }

    const server = await db.server.findFirst({
      where: {
        id: serverId as string,
        members: {
          some: {
            profileId: profile?.id,
          },
        },
      },
      include: {
        members: true,
      },
    });

    if (!server) {
      res.status(404).json({ message: "Server Not Found" });
    }

    const channel = await db.channel.findFirst({
      where: {
        id: channelId as string,
        serverId: serverId as string,
      },
    });

    if (!channel) {
      res.status(404).json({ message: "Channel Not Found" });
    }

    const member = server?.members.find(
      (member) => member.profileId === profile?.id
    );
    if (!member) {
      res.status(404).json({ message: "Member Not Found" });
    }

    const message = await db.message.create({
      data: {
        content,
        fileUrl,
        channelId: channelId as string,
        //@ts-ignore
        memberId: member.id,
      },
      include: {
        member: {
          include: {
            profile: true,
          },
        },
      },
    });
    const channelKey = `chat:${channelId}:messages`;
    res?.socket?.server?.io?.emit(channelKey, message);
    return res.status(200).json(message);
  } catch (err) {
    console.log("[MESSAGES_POST]", err);
    return res.status(500).json({ message: "Internal Error" });
  }
}
