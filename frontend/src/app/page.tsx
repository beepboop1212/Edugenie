// src/app/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Layout, Avatar, Button, Input, Card, Radio, Space, Typography, Spin, Alert, Result, Slider, Form, Row, Col, Upload, Segmented, Select } from 'antd';
import { InboxOutlined, CheckCircleFilled, CloseCircleFilled, ArrowLeftOutlined, ArrowRightOutlined, BulbOutlined } from '@ant-design/icons';
// FIX: Added UseMutateFunction to correctly type the prop we will pass
import { useMutation, UseMutateFunction } from '@tanstack/react-query';
import axios from 'axios';
import type { UploadFile } from 'antd/es/upload/interface';
import './flashcard.css';

const { Header, Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { Dragger } = Upload;

// --- TYPE DEFINITIONS (Unchanged) ---
interface Question {
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}
interface QuizData {
  questions: Question[];
  source_name: string;
}
interface Flashcard {
  term: string;
  definition: string;
}
interface FlashcardData {
  flashcards: Flashcard[];
  source_name: string;
}
interface ResultPayload {
  user_id: string;
  topic: string;
  score: number;
  total_questions: number;
}
interface FlashcardSessionPayload {
  user_id: string;
  source_name: string;
  card_count: number;
}

const difficultyLevels = [
  { value: 'Kindergarten', label: 'Kindergarten' },
  { value: 'Elementary School', label: 'Elementary School (Beginner)' },
  { value: 'Middle School', label: 'Middle School' },
  { value: 'High School', label: 'High School (Intermediate)' },
  { value: 'Undergraduate', label: 'University / Undergraduate' },
  { value: 'Graduate', label: 'Graduate / Master\'s Level (Advanced)' },
  { value: 'PhD Level', label: 'PhD Level (Expert)' },
  { value: 'for a general audience', label: 'General Audience' },
];

interface FlashcardViewerProps {
  data: FlashcardData;
  onStartNew: () => void;
  onSubmitSession: UseMutateFunction<any, Error, FlashcardSessionPayload, unknown>;
  userId: string;
}

const FlashcardViewer: React.FC<FlashcardViewerProps> = ({ data, onStartNew, onSubmitSession, userId }) => {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [hasSessionBeenSaved, setHasSessionBeenSaved] = useState(false);

  // This hook will now work correctly because this component's state is preserved.
  useEffect(() => {
    const isLastCard = currentCardIndex === data.flashcards.length - 1;
    if (isLastCard && !hasSessionBeenSaved) {
      console.log("Last flashcard reached. Saving session to database...");
      onSubmitSession({
        user_id: userId,
        source_name: data.source_name,
        card_count: data.flashcards.length,
      });
      setHasSessionBeenSaved(true);
    }
  }, [currentCardIndex, data, hasSessionBeenSaved, onSubmitSession, userId]);

  const currentCard = data.flashcards[currentCardIndex];
  const goToNext = () => { if (currentCardIndex < data.flashcards.length - 1) { setIsFlipped(false); setCurrentCardIndex(currentCardIndex + 1); } };
  const goToPrev = () => { if (currentCardIndex > 0) { setIsFlipped(false); setCurrentCardIndex(currentCardIndex - 1); } };

  return (
    <Card variant="borderless" style={{ background: 'transparent' }}>
      <Title level={3} style={{ textAlign: 'center', marginBottom: 24 }}>Flashcards on: {data.source_name}</Title>
      <div className="flashcard-container" onClick={() => setIsFlipped(!isFlipped)}>
        <div className={`flashcard ${isFlipped ? 'is-flipped' : ''}`}>
          <div className="flashcard-face flashcard-front"><Text>{currentCard.term}</Text></div>
          <div className="flashcard-face flashcard-back"><Text>{currentCard.definition}</Text></div>
        </div>
      </div>
      <div style={{ textAlign: 'center', margin: '24px 0' }}><Text strong>Card {currentCardIndex + 1} of {data.flashcards.length}</Text></div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={goToPrev} disabled={currentCardIndex === 0}>Previous</Button>
        <Button type="primary" onClick={onStartNew}>Create New Set</Button>
        <Button icon={<ArrowRightOutlined />} onClick={goToNext} disabled={currentCardIndex === data.flashcards.length - 1}>Next</Button>
      </div>
    </Card>
  );
};


// --- The Main Page Component ---
export default function HomePage() {
  const [form] = Form.useForm();
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [flashcardData, setFlashcardData] = useState<FlashcardData | null>(null);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [generationMode, setGenerationMode] = useState<'quiz' | 'flashcard'>('quiz');
  const USER_ID = "hackathon_user_123";

  const { mutate: generateContent, isPending } = useMutation({
    mutationFn: (formData: FormData) => axios.post('http://localhost:8000/api/generate-quiz', formData),
    onSuccess: (res) => {
      setQuizData(null);
      setFlashcardData(null);
      if (res.data.mode === 'flashcard') setFlashcardData(res.data);
      else {
        setQuizData(res.data);
        setUserAnswers(new Array(res.data.questions.length).fill(''));
        setIsSubmitted(false);
      }
    },
    onError: (error: any) => alert(`Error: ${error.response?.data?.detail || 'An unknown error occurred.'}`),
  });
  
  const { mutate: submitResult } = useMutation({
    mutationFn: (resultData: ResultPayload) => axios.post('http://localhost:8000/api/submit-result', resultData),
    onSuccess: () => console.log('Quiz result saved successfully!'),
    onError: (error) => console.error('Error saving quiz result:', error),
  });

  const { mutate: submitFlashcardSession } = useMutation({
    mutationFn: (sessionData: FlashcardSessionPayload) => axios.post('http://localhost:8000/api/submit-flashcard-session', sessionData),
    onSuccess: () => console.log('Flashcard session saved successfully!'),
    onError: (error) => console.error('Error saving flashcard session:', error),
  });

  const handleGenerate = (values: { topic?: string; num_questions: number; difficulty: string; }) => {
    if (!fileToUpload && (!values.topic || values.topic.trim() === '')) {
      alert("Please either enter a topic or upload a file.");
      return;
    }
    const formData = new FormData();
    formData.append('mode', generationMode);
    formData.append('num_questions', values.num_questions.toString());
    formData.append('difficulty', values.difficulty || '');
    if (fileToUpload) formData.append('file', fileToUpload);
    else if (values.topic && values.topic.trim() !== "") formData.append('topic', values.topic);
    else {
      alert("Please provide a valid topic or file.");
      return;
    }
    generateContent(formData);
  };
  
  const handleAnswerChange = (questionIndex: number, answer: string) => {
    const newAnswers = [...userAnswers];
    newAnswers[questionIndex] = answer;
    setUserAnswers(newAnswers);
  };

  const handleQuizSubmission = () => {
    if (!quizData) return;
    const score = quizData.questions.reduce((acc, q, index) => (userAnswers[index] === q.correctAnswer ? acc + 1 : acc), 0);
    submitResult({
      user_id: USER_ID,
      topic: quizData.source_name,
      score: score,
      total_questions: quizData.questions.length
    });
    setIsSubmitted(true);
  };

  const startNew = () => {
    setQuizData(null);
    setFlashcardData(null);
    setIsSubmitted(false);
    setFileList([]);
    setFileToUpload(null);
    form.resetFields();
  };
  
  const renderResults = () => {
    if (!quizData) return null;
    const score = userAnswers.reduce((acc, ans, idx) => (ans === quizData.questions[idx].correctAnswer ? acc + 1 : acc), 0);
    return (
      <Card variant="borderless" style={{ background: 'transparent' }}>
        <Result
          status={score > quizData.questions.length / 2 ? "success" : "warning"}
          title={`Quiz on "${quizData.source_name}" Complete!`}
          subTitle={`You scored ${score} out of ${quizData.questions.length}`}
          extra={[<Button type="primary" key="new" onClick={startNew}>Create New Quiz</Button>]}
        />
        <Title level={4} style={{ marginTop: 24, textAlign: 'center' }}>Review Your Answers</Title>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {quizData.questions.map((q, index) => {
          const isCorrect = userAnswers[index] === q.correctAnswer;
          const questionTitle = <span className="long-text-wrap">{`${index + 1}. ${q.questionText}`}</span>;
          return (
            <Card key={index} type="inner" title={questionTitle}
              styles={{ header: { backgroundColor: isCorrect ? '#f6ffed' : '#fffbe6', borderLeft: `5px solid ${isCorrect ? '#52c41a' : '#faad14'}`, fontWeight: 500 }}}
            >
              <Radio.Group value={userAnswers[index]} style={{width: '100%'}}>
                <Space direction="vertical" style={{width: '100%'}}>
                  {q.options.map((option) => {
                    const isUserChoice = userAnswers[index] === option;
                    const isCorrectChoice = q.correctAnswer === option;
                    return (
                      <Radio key={option} value={option} disabled>
                        {option}
                        {isCorrectChoice && <CheckCircleFilled style={{ color: '#52c41a', marginLeft: 8 }} />}
                        {isUserChoice && !isCorrectChoice && <CloseCircleFilled style={{ color: '#ff4d4f', marginLeft: 8 }} />}
                      </Radio>
                    )
                  })}
                </Space>
              </Radio.Group>
              <Alert style={{ marginTop: 16 }} message={<Text strong>Explanation</Text>} description={q.explanation} type="info"/>
            </Card>
          );
        })}
        </Space>
      </Card>
    );
  };
  
  const renderQuiz = () => {
    if (!quizData) return null;
    return (
      <Card variant="borderless" style={{ background: 'transparent' }}>
        <Title level={3} style={{ textAlign: 'center' }}>Quiz on: {quizData.source_name}</Title>
        <Paragraph style={{ textAlign: 'center', color: '#888', marginBottom: 24 }}>Select the best answer for each question below.</Paragraph>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {quizData.questions.map((q, index) => {
          const questionTitle = <span className="long-text-wrap">{`${index + 1}. ${q.questionText}`}</span>;
          
          return (
            <Card key={index} type="inner" title={questionTitle}>
              <Radio.Group onChange={(e) => handleAnswerChange(index, e.target.value)} value={userAnswers[index]}>
                <Space direction="vertical">{q.options.map((option) => <Radio key={option} value={option}>{option}</Radio>)}</Space>
              </Radio.Group>
            </Card>
          )
        })}
        </Space>
        <Button type="primary" size="large" block onClick={handleQuizSubmission} style={{ marginTop: 32 }}>Submit Quiz & See Results</Button>
      </Card>
    );
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', backgroundColor: '#fff', borderBottom: '1px solid #f0f0f0', padding: '0 24px' }}>
        <Avatar size="large" icon={<BulbOutlined />} style={{ backgroundColor: '#007A7C', marginRight: 16 }} />
        <Title level={3} style={{ color: '#003a3b', margin: 0, fontWeight: 600, lineHeight: '64px' }}>EduGenie</Title>
      </Header>
      <Content style={{ padding: '48px 16px' }}>
        <main style={{ maxWidth: 800, margin: 'auto' }}>
      
          {isPending && <div style={{ textAlign: 'center' }}><Spin size="large" /></div>}

          {!isPending && !quizData && !flashcardData && (
            <Card variant="borderless" style={{ background: '#fff', padding: '16px', borderRadius: '12px' }}>
              <Form form={form} layout="vertical" onFinish={handleGenerate} initialValues={{ num_questions: 5, difficulty: null }}>
                <Form.Item label={<Title level={5}>What do you want to generate?</Title>}>
                  <Segmented options={[{ label: 'Quiz', value: 'quiz' }, { label: 'Flashcards', value: 'flashcard' }]} value={generationMode} onChange={(value: string) => setGenerationMode(value as 'quiz' | 'flashcard')} block />
                </Form.Item>
                <Title level={5}>Option 1: Generate from a Topic</Title>
                <Form.Item name="topic"><Input placeholder="e.g., The Krebs Cycle, World War II" disabled={!!fileToUpload} /></Form.Item>
                <Text strong style={{display: 'block', textAlign: 'center', margin: '16px 0'}}>OR</Text>
                <Title level={5}>Option 2: Generate from a File</Title>
                <Form.Item><Dragger name="file" fileList={fileList} maxCount={1} onRemove={() => { setFileList([]); setFileToUpload(null); return true; }} beforeUpload={(file) => { setFileToUpload(file); setFileList([file]); form.setFieldsValue({ topic: '' }); return false; }}><p className="ant-upload-drag-icon"><InboxOutlined /></p><p className="ant-upload-text">Click or drag file to this area</p><p className="ant-upload-hint">Supported: PDF, DOCX, PPTX</p></Dragger></Form.Item>
                <Title level={5} style={{marginTop: 24}}>Settings</Title>
                <Row gutter={16}>
                  <Col span={12}><Form.Item name="num_questions" label={generationMode === 'quiz' ? 'Number of Questions' : 'Number of Flashcards'}><Slider min={3} max={15} /></Form.Item></Col>
                  <Col span={12}>
                    {/* --- FIX: Replaced the Input with a Select component --- */}
                    <Form.Item name="difficulty" label="Difficulty Level">
                      <Select
                        placeholder="Select a level"
                        options={difficultyLevels}
                        allowClear // This adds a small 'x' to clear the selection
                      />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item><Button type="primary" htmlType="submit" loading={isPending} block size="large">Generate Content</Button></Form.Item>
              </Form>
            </Card>
          )}

          {!isPending && quizData && (isSubmitted ? renderResults() : renderQuiz())}
        
          {!isPending && flashcardData && (
            <FlashcardViewer 
              data={flashcardData} 
              onStartNew={startNew} 
              onSubmitSession={submitFlashcardSession}
              userId={USER_ID}
            />
          )}
        </main>
      </Content>
    </Layout>
  );
}