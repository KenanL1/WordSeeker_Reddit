// Learn more at developers.reddit.com/docs
import { Devvit, useForm, useState } from "@devvit/public-api";
import Words from "./data/words.json" assert { type: "json" };

import { Router } from "./posts/Router.js";
import { Service } from "./service/Service.js";

Devvit.configure({
  redditAPI: true,
  redis: true,
});

// Add a menu item to the subreddit menu for instantiating the new experience post
Devvit.addMenuItem({
  label: "Install Game",
  location: "subreddit",
  forUserType: "moderator",
  onPress: async (_event, context) => {
    const { reddit, ui } = context;
    const subreddit = await reddit.getCurrentSubreddit();
    const service = new Service(context);

    // Create a pinned post
    const post = await reddit.submitPost({
      title: "My devvit post",
      subredditName: subreddit.name,
      // The preview appears while the post loads
      preview: (
        <vstack height="100%" width="100%" alignment="middle center">
          <text size="large">Loading ...</text>
        </vstack>
      ),
    });
    const postData = {
      // cards: arr,
      // guess: values.guess,
      postType: "createPost",
    };

    await Promise.all([
      // Pin the post
      post.sticky(),
      // Store the post data
      context.redis.set(`post:${post.id}`, JSON.stringify(postData)),
      // Store the game settings
      service.storeGameSettings({
        subredditName: subreddit.name,
        selectedDictionary: "main",
      }),
      // Seed in words for main dictionary
      service.upsertDictionary("main", Words),
    ]);

    ui.navigateTo(post);
    ui.showToast({ text: "Created post!" });
  },
});

// Add a post type definition
Devvit.addCustomPostType({
  name: "CreatePost",
  height: "tall",
  render: Router,
});

// Devvit.addCustomPostType({
//   name: "GuessPost",
//   height: "regular",
//   render: Router,
// });

export default Devvit;
