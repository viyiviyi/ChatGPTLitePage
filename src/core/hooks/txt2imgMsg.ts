import { reloadTopic } from '@/components/Chat/Message/MessageList';
import { Message } from '@/Models/DataBase';
import { TopicMessage } from '@/Models/Topic';
import { useCallback, useEffect } from 'react';
import { ChatManagement } from '../ChatManagement';
import { ImageStore } from '../db/ImageDb';
import { init } from '../drawApi/init';
import { ApiInstance, getSdApiBaseUrl, Img2ImgParams } from '../drawApi/storage';
import { TaskQueue } from '../utils/TaskQueue';

let quequ = new TaskQueue();

export function useTxt2Img(chat: ChatManagement) {
  useEffect(() => {
    let url = getSdApiBaseUrl();
    init(url).then(() => {});
  }, []);
  const txt2img = useCallback(
    async function (topic: TopicMessage, msg: Message, param: Img2ImgParams) {
      if (msg.imageIds) msg.imageIds.push('loading');
      else msg.imageIds = ['loading'];
      reloadTopic(topic.id, msg.id);
      quequ
        .enqueue(async () => {
          return await ApiInstance.current.text2imgapiSdapiV1Txt2imgPost({ stableDiffusionProcessingTxt2Img: param });
        })
        .then((res) => {
          res.images?.forEach((base64) => {
            base64 = 'data:image/png;base64,' + base64;
            let imgId = ImageStore.getInstance().saveImage(base64);
            msg.imageIds!.push(imgId);
          });
          let firstLoadingIdx = msg.imageIds!.indexOf('loading');
          msg.imageIds!.splice(firstLoadingIdx, 1);
          chat.pushMessage(msg);
          reloadTopic(topic.id, msg.id);
        })
        .catch((err) => {
          console.error(err);
          let firstLoadingIdx = msg.imageIds!.indexOf('loading');
          msg.imageIds!.splice(firstLoadingIdx, 1, 'error');
          reloadTopic(topic.id, msg.id);
        });
    },
    [chat]
  );
  return { txt2img };
}