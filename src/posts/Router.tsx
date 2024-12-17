import type { Context } from "@devvit/public-api";
import { Devvit, useAsync, useState } from "@devvit/public-api";

import { CreateScreen } from "./CreateScreen.js";
import { GuessScreen } from "./GuessScreen.js";
import { Service } from "../service/Service.js";

export const Router: Devvit.CustomPostComponent = (context: Context) => {
  const service = new Service(context);
  const getUsername = async () => {
    if (!context.userId) return null; // Return early if no userId
    const cacheKey = "cache:userId-username";
    const cache = await context.redis.hGet(cacheKey, context.userId);
    if (cache) {
      return cache;
    } else {
      const user = await context.reddit.getUserById(context.userId);
      if (user) {
        await context.redis.hSet(cacheKey, {
          [context.userId]: user.username,
        });
        return user.username;
      }
    }
    return null;
  };
  const { data: username } = useAsync(async () => {
    return await getUsername();
  });
  const {
    data: postData,
    loading,
    error,
  } = useAsync(async () => {
    const data = await context.redis.get(`post:${context.postId}`);
    // console.log(`data: ${data}`);
    return data && JSON.parse(data);
  });

  const { data: dictionary } = useAsync(async () => {
    return service.getActiveDictionaries();
  });

  if (!dictionary || !username || !postData) {
    return <vstack></vstack>;
  }

  return (
    <zstack gap="large" width="100%" height="100%" alignment="middle center">
      {postData && postData.postType == "guessPost" ? (
        <GuessScreen postData={postData} username={username} />
      ) : (
        <CreateScreen
          postData={postData}
          username={username}
          dictionary={dictionary}
        />
      )}
    </zstack>
  );
};
