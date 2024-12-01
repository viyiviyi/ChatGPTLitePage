import { reloadTopic } from '@/components/Chat/Message/MessageList';
import { Message } from '@/Models/DataBase';
import { TopicMessage } from '@/Models/Topic';
import { useCallback, useEffect } from 'react';
import { ChatManagement } from '../ChatManagement';
import { init } from '../drawApi/init';
import { ApiInstance, getSdApiBaseUrl, Img2ImgParams } from '../drawApi/storage';
import { getUuid } from '../utils/utils';
import { useReloadIndex } from './hooks';

let runing = new Promise((resolve) => {
  resolve(true);
});

export function useTxt2Img(chat: ChatManagement) {
  useEffect(() => {
    let url = getSdApiBaseUrl();
    init(url).then(() => {});
  }, []);
  const { reloadIndex } = useReloadIndex(chat);
  const txt2img = useCallback(
    async function (topic: TopicMessage, msg: Message, param: Img2ImgParams) {
      let idx = topic.messages.indexOf(msg);
      let imgMsg: Message = {
        id: getUuid(),
        groupId: msg.groupId,
        topicId: topic.id,
        ctxRole: 'system',
        createTime: Date.now(),
        timestamp: msg.timestamp + 0.001, // 正常排序最小间隔是0.01
        text: '正在生成图片...',
        skipCtx: true,
      };
      topic.messages.splice(idx, 1, ...[msg, imgMsg]);
      topic.messageMap[imgMsg.id] = imgMsg;
      reloadIndex(topic, idx);
      reloadTopic(topic.id);
      if (runing) await runing;
      runing = ApiInstance.current
        .text2imgapiSdapiV1Txt2imgPost({ stableDiffusionProcessingTxt2Img: param })
        .then((res) => {
          imgMsg.text = '';
          res.images?.forEach((base64) => {
            imgMsg.text += `![${res.info}](data:image/png;base64,${base64})\n`;
          });
          ChatManagement.createMessage(imgMsg);
          reloadTopic(topic.id, imgMsg.id);
        })
        .catch((err) => {
          console.error(err);
          imgMsg.text = '生成图片失败 err:' + (err.status || err.toString());
          reloadTopic(topic.id, imgMsg.id);
        });
    },
    [reloadIndex]
  );
  return { txt2img };
}
