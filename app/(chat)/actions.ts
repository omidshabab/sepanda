'use server';

import { generateText, type UIMessage } from 'ai';
import { cookies } from 'next/headers';
import {
  deleteMessagesByChatIdAfterTimestamp,
  getMessageById,
  updateChatVisiblityById,
} from '@/lib/db/queries';
import type { VisibilityType } from '@/components/visibility-selector';
import { myProvider } from '@/lib/ai/providers';

export async function saveChatModelAsCookie(model: string) {
  const cookieStore = await cookies();
  cookieStore.set('chat-model', model);
}

export async function generateTitleFromUserMessage({
  message,
}: {
  message: UIMessage;
}) {
  try {
    console.log('Generating title for message:', JSON.stringify(message, null, 2));
    
    const { text: title } = await generateText({
      model: myProvider.languageModel('title-model'),
      system: `\n
      - شما باید یک عنوان کوتاه بر اساس اولین پیامی که کاربر شروع مکالمه می‌کند، تولید کنید
      - مطمئن شوید که بیش از ۸۰ کاراکتر نباشد
      - عنوان باید خلاصه‌ای از پیام کاربر باشد
      - از نقل قول یا دو نقطه استفاده نکنید
      - پاسخ را به زبان فارسی بنویسید، حتی اگر پیام کاربر به زبان دیگری باشد`,
      prompt: JSON.stringify(message),
    });
    
    console.log('Generated title:', title);
    
    // Ensure we have a valid title
    if (!title || typeof title !== 'string' || title.trim() === '') {
      console.log('Title was empty or invalid, using fallback');
      return 'گفتگوی جدید';
    }
    
    return title;
  } catch (error) {
    console.error('Error generating title:', error);
    return 'گفتگوی جدید';
  }
}

export async function deleteTrailingMessages({ id }: { id: string }) {
  const [message] = await getMessageById({ id });

  await deleteMessagesByChatIdAfterTimestamp({
    chatId: message.chatId,
    timestamp: message.createdAt,
  });
}

export async function updateChatVisibility({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: VisibilityType;
}) {
  await updateChatVisiblityById({ chatId, visibility });
}
