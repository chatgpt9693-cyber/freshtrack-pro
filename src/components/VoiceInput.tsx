import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface VoiceInputProps {
  onResult: (text: string) => void;
  className?: string;
  placeholder?: string;
}

export function VoiceInput({ onResult, className, placeholder = "Нажмите для записи" }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    // Проверяем поддержку Web Speech API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'ru-RU'; // Русский язык
      
      recognition.onstart = () => {
        setIsListening(true);
        console.log('Голосовой ввод начат');
      };
      
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        console.log('Распознанный текст:', transcript);
        
        // Очищаем и форматируем текст
        const cleanText = transcript.trim();
        if (cleanText) {
          onResult(cleanText);
          toast.success("Текст распознан", {
            description: cleanText,
          });
        }
      };
      
      recognition.onerror = (event) => {
        console.error('Ошибка распознавания:', event.error);
        setIsListening(false);
        
        let errorMessage = "Ошибка распознавания речи";
        switch (event.error) {
          case 'no-speech':
            errorMessage = "Речь не обнаружена. Попробуйте еще раз.";
            break;
          case 'audio-capture':
            errorMessage = "Нет доступа к микрофону.";
            break;
          case 'not-allowed':
            errorMessage = "Доступ к микрофону запрещен.";
            break;
          case 'network':
            errorMessage = "Ошибка сети. Проверьте подключение.";
            break;
        }
        
        toast.error("Ошибка голосового ввода", {
          description: errorMessage,
        });
      };
      
      recognition.onend = () => {
        setIsListening(false);
        console.log('Голосовой ввод завершен');
      };
      
      recognitionRef.current = recognition;
    } else {
      console.warn('Web Speech API не поддерживается в этом браузере');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [onResult]);

  const startListening = () => {
    if (!recognitionRef.current || isListening) return;
    
    try {
      recognitionRef.current.start();
      toast.info("Говорите сейчас...", {
        description: "Четко произнесите название товара",
      });
    } catch (error) {
      console.error('Ошибка запуска распознавания:', error);
      toast.error("Не удалось запустить голосовой ввод");
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  if (!isSupported) {
    return null; // Скрываем кнопку если не поддерживается
  }

  return (
    <Button
      type="button"
      variant={isListening ? "destructive" : "outline"}
      size="sm"
      onClick={isListening ? stopListening : startListening}
      className={cn("gap-2", className)}
      disabled={!isSupported}
    >
      {isListening ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Остановить
        </>
      ) : (
        <>
          <Mic className="w-4 h-4" />
          Голос
        </>
      )}
    </Button>
  );
}

// Типы для TypeScript
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
  length: number;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}