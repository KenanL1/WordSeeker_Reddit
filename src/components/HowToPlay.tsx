import { Context, Devvit, useState } from "@devvit/public-api";

interface HowToPlayPageProps {
  onClose: () => void;
}

export const HowToPlay = (props: any, _context: Context): JSX.Element => {
  const numPages = 5;
  const [page, setPage] = useState<number>(0);

  const pages = [
    <image
      url="Instructions1.png"
      imageHeight={512}
      imageWidth={512}
      height="380px"
      width="512px"
      grow
    />,
    <image
      url="Instructions2.png"
      imageHeight={512}
      imageWidth={512}
      height="380px"
      width="512px"
    />,
    <image
      url="Instructions3.png"
      imageHeight={512}
      imageWidth={512}
      height="380px"
      width="512px"
    />,
    <image
      url="Instructions4.png"
      imageHeight={512}
      imageWidth={512}
      height="380px"
      width="512px"
    />,
    <image
      url="Instructions5.png"
      imageHeight={512}
      imageWidth={512}
      height="380px"
      width="512px"
    />,
  ];

  return (
    <vstack
      width="100%"
      height="100%"
      alignment="center"
      padding="medium"
      gap="medium"
    >
      {/* Header */}
      <hstack width="100%" alignment="top">
        <spacer width="40px" />
        <text
          color="white"
          weight="bold"
          size="xxlarge"
          overflow="ellipsis"
          grow
          alignment="center"
        >
          How To Play
        </text>
        <button icon="close" onPress={props.onClose} />
      </hstack>

      <hstack alignment="middle">{pages[page]}</hstack>
      <hstack width="100%">
        <button
          disabled={page == 0}
          icon="left"
          onPress={() => setPage(page - 1)}
        ></button>
        <spacer grow></spacer>
        <button
          disabled={page == numPages - 1}
          icon="right"
          onPress={() => setPage(page + 1)}
        ></button>
      </hstack>
      <spacer height="20px" />
    </vstack>
  );
};
