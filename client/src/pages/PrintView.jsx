import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { getQuestions, getCourses, getImageUrl, getQuestion } from '../api';
import { ChevronLeft, Loader2, AlertCircle, Eye, EyeOff, Printer, CheckCircle2 } from 'lucide-react';

export default function PrintView() {
  const { courseId } = useParams();
  const [searchParams] = useSearchParams();
  const [questions, setQuestions] = useState([]);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSolutions, setShowSolutions] = useState(true);
  const [imagesLoaded, setImagesLoaded] = useState(0);
  const [totalImages, setTotalImages] = useState(0);

  const filterYears = useMemo(() => searchParams.getAll('year'), [searchParams]);
  const filterTypes = useMemo(() => searchParams.getAll('type'), [searchParams]);
  const filterTags = useMemo(() => searchParams.getAll('tag'), [searchParams]);
  const sortBy = useMemo(() => searchParams.get('sortBy') || 'question_number', [searchParams]);
  const sortOrder = useMemo(() => searchParams.get('sortOrder') || 'asc', [searchParams]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [coursesData, questionsData] = await Promise.all([
          getCourses(),
          getQuestions(courseId)
        ]);
        
        const currentCourse = coursesData.find(c => c.id == courseId);
        setCourse(currentCourse);

        let filtered = questionsData;
        if (filterYears.length > 0) filtered = filtered.filter(q => filterYears.includes(q.year?.toString()));
        if (filterTypes.length > 0) filtered = filtered.filter(q => filterTypes.includes(q.type));
        if (filterTags.length > 0) filtered = filtered.filter(q => filterTags.every(tag => q.tags?.some(t => t.name === tag)));

        filtered.sort((a, b) => {
            let valA = a[sortBy] ?? '';
            let valB = b[sortBy] ?? '';
            if (sortBy === 'question_number') {
                const numA = parseInt(valA) || 0;
                const numB = parseInt(valB) || 0;
                if (numA !== numB) return sortOrder === 'asc' ? numA - numB : numB - numA;
            }
            return sortOrder === 'asc' 
                ? valA.toString().localeCompare(valB.toString(), undefined, { numeric: true }) 
                : valB.toString().localeCompare(valA.toString(), undefined, { numeric: true });
        });

        const fullDetails = await Promise.all(
            filtered.map(async q => {
                const data = await getQuestion(q.id);
                const groupedSolutions = [];
                const groups = {};
                if (data.solutions) {
                    const sortedSols = [...data.solutions].sort((a, b) => (a.page_order || 0) - (b.page_order || 0));
                    sortedSols.forEach(sol => {
                        const gid = sol.group_id || `legacy-${sol.id}`;
                        if (!groups[gid]) {
                            groups[gid] = { id: gid, title: sol.title, parts: [] };
                            groupedSolutions.push(groups[gid]);
                        }
                        groups[gid].parts.push(sol);
                    });
                }
                return { ...data, groupedSolutions };
            })
        );

        let imgCount = 0;
        fullDetails.forEach(q => {
            q.pages?.forEach(p => { if (p.image_path) imgCount++; });
            q.solutions?.forEach(s => { if (s.image_path) imgCount++; });
        });
        setTotalImages(imgCount);
        setQuestions(fullDetails);
      } catch (err) {
        console.error("Print fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [courseId, filterYears, filterTypes, filterTags, sortBy, sortOrder]);

  const handleImageLoad = () => {
    setImagesLoaded(prev => prev + 1);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-white">
        <Loader2 className="animate-spin text-primary" size={40} />
        <p className="font-black uppercase tracking-widest text-[10px] text-gray-500">Retrieving Archive Content...</p>
    </div>
  );

  const allImagesReady = totalImages === 0 || imagesLoaded >= totalImages;

  return (
    <div className="bg-white min-h-screen">
      {/* Navbar - Hidden on Print */}
      <div className="print:hidden sticky top-0 z-50 bg-white border-b border-gray-200 p-4 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Link to={`/courses/${courseId}`} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ChevronLeft size={20} /></Link>
                <div>
                    <h1 className="font-black text-sm uppercase tracking-tight">{course?.code} Print Preview</h1>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">
                        {questions.length} Questions • {imagesLoaded}/{totalImages} Images Loaded
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <button 
                    onClick={() => setShowSolutions(!showSolutions)} 
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border transition-all ${showSolutions ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-400 border-gray-200'}`}
                >
                    {showSolutions ? 'Solutions: Included' : 'Questions Only'}
                </button>
                <button 
                    onClick={handlePrint} 
                    disabled={!allImagesReady}
                    className="flex items-center gap-2 bg-primary text-white px-8 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg hover:bg-primary-hover disabled:opacity-50 disabled:bg-gray-300 transition-all active:scale-95"
                >
                    {!allImagesReady ? <Loader2 className="animate-spin" size={14} /> : <Printer size={14} />}
                    {!allImagesReady ? 'Loading Images...' : 'Print / Save as PDF'}
                </button>
            </div>
        </div>
      </div>

      {/* Main Content Area - No flex/grid on the outer container for print compatibility */}
      <div className="max-w-[850px] mx-auto p-8 md:p-16 print:p-0 print:max-w-none">
          <header className="mb-16 border-b-4 border-black pb-10 text-center">
              <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">{course?.title}</h1>
              <p className="text-xs font-bold uppercase tracking-[0.4em] text-gray-400">
                  Academic Archive • {course?.code} • {new Date().toLocaleDateString()}
              </p>
          </header>

          <div className="print-content-wrapper">
              {questions.map((q, idx) => (
                  <section key={q.id} className="question-block pt-4 mb-20 print:mb-0">
                      <div className="flex justify-between items-end mb-8 border-b-2 border-gray-900 pb-4">
                          <div className="flex items-start gap-4">
                              <span className="bg-black text-white text-xs font-black px-3 py-1.5 rounded-lg shrink-0">
                                  {q.question_number ? `Q${q.question_number}` : idx + 1}
                              </span>
                              <h2 className="text-2xl font-black tracking-tight text-gray-900 leading-tight">{q.title || 'Untitled Question'}</h2>
                          </div>
                          <div className="text-right flex flex-col items-end gap-1 shrink-0">
                              {q.year && <span className="text-xs font-black bg-gray-100 px-3 py-1 rounded-full text-gray-600 border border-gray-200">{q.year}</span>}
                              {q.type && <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{q.type}</span>}
                          </div>
                      </div>

                      <div className="question-body">
                          {q.pages?.map((page, pIdx) => (
                              <div key={page.id || pIdx} className="mb-8 block">
                                  {page.image_path && (
                                      <div className="rounded-3xl overflow-hidden border border-gray-200 bg-gray-50 mb-4 block text-center">
                                          <img 
                                              src={getImageUrl(page.image_path)} 
                                              alt="" 
                                              className="max-w-full h-auto inline-block"
                                              onLoad={handleImageLoad}
                                              onError={handleImageLoad} 
                                          />
                                      </div>
                                  )}
                                  {page.content && (
                                      <div className="text-base leading-relaxed text-gray-800 prose prose-slate max-w-none px-2 block">
                                          <ReactMarkdown>{page.content}</ReactMarkdown>
                                      </div>
                                  )}
                              </div>
                          ))}

                          {showSolutions && q.groupedSolutions?.length > 0 && (
                              <div className="mt-12 p-10 bg-gray-50 rounded-[2.5rem] border border-gray-200 shadow-inner block break-inside-avoid">
                                  <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                                      <div className="w-8 h-px bg-gray-300"></div>
                                      Solutions Archive
                                      <div className="w-8 h-px bg-gray-300"></div>
                                  </div>
                                  
                                  <div className="space-y-12">
                                      {q.groupedSolutions.map((group, gIdx) => (
                                          <div key={group.id || gIdx} className="mb-10 block">
                                              {group.title && (
                                                  <div className="flex items-center gap-2 mb-4">
                                                      <CheckCircle2 size={14} className="text-green-600" />
                                                      <h4 className="text-xs font-black text-green-700 uppercase tracking-widest">{group.title}</h4>
                                                  </div>
                                              )}
                                              <div className="pl-4 border-l-2 border-gray-200 block">
                                                  {group.parts.map((part, pIdx) => (
                                                      <div key={part.id || pIdx} className="mb-6 block">
                                                          {part.image_path && (
                                                              <img 
                                                                  src={getImageUrl(part.image_path)} 
                                                                  alt="" 
                                                                  className="max-w-full h-auto rounded-2xl border border-gray-200 shadow-sm block mb-4"
                                                                  onLoad={handleImageLoad}
                                                                  onError={handleImageLoad}
                                                              />
                                                          )}
                                                          {part.content && (
                                                              <div className="text-sm text-gray-700 italic leading-relaxed block">
                                                                  <ReactMarkdown>{part.content}</ReactMarkdown>
                                                              </div>
                                                          )}
                                                      </div>
                                                  ))}
                                              </div>
                                          </div>
                                      ))}
                                  </div>
                                </div>
                          )}
                      </div>
                  </section>
              ))}
          </div>

          <footer className="mt-32 pt-12 border-t border-gray-100 text-center block">
              <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.5em]">End of Transcript</p>
              <p className="text-[9px] font-bold text-gray-200 uppercase tracking-widest mt-2">Past Question Manager • Confidential Academic Resource</p>
          </footer>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            margin: 15mm;
            size: A4 portrait;
          }
          html, body {
            height: auto !important;
            overflow: visible !important;
            background: white !important;
            color: black !important;
          }
          .print-hidden {
            display: none !important;
          }
          .question-block {
            display: block !important;
            break-after: page !important;
            page-break-after: always !important;
            padding-top: 10mm !important;
          }
          .question-block:last-child {
            break-after: auto !important;
            page-break-after: auto !important;
          }
          img {
            max-width: 100% !important;
            height: auto !important;
            display: block !important;
            margin: 0 auto !important;
            break-inside: avoid !important;
          }
          .break-inside-avoid {
            break-inside: avoid !important;
          }
        }
      `}} />
    </div>
  );
}
