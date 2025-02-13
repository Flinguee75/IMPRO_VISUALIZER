"use client"

import { useState, useRef, ChangeEvent } from "react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { ArrowUpTrayIcon, PlayIcon, ArrowPathIcon } from "@heroicons/react/24/outline"

const AudioVisualizer = dynamic(() => import("@/components/AudioVisualizer"), { ssr: false })

export default function Home() {
  const [isStarted, setIsStarted] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Déclenche le clic sur l'input caché
  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  // Gère la sélection d'un fichier
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if(e.target.files && e.target.files[0]){
      setUploadedFile(e.target.files[0])
    }
  }

  return (
    <main className="relative min-h-screen">
      {/* Background gradient */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background: "radial-gradient(circle, rgb(6, 36, 86) 10%, rgb(0, 0, 0) 100%)"
        }}
      ></div>

      {/* Input file caché */}
      <input
        type="file"
        accept="audio/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Main content */}
      <div className="relative flex flex-col min-h-screen p-8">
        <h1 className="text-5xl font-bold mb-8 text-sky-500 text-center">
          Lyric Rhyme Visualizer
        </h1>

        <div className="flex flex-col lg:flex-row gap-8 flex-1 items-start justify-center">
          {/* Left side: Information */}
          <div className="bg-slate-900 bg-opacity-80 p-4 rounded-lg border border-sky-900 shadow-md">
            <h2 className="text-2xl font-bold text-sky-500 mb-4">Information</h2>
            <ul className="list-disc list-inside text-lg text-sky-400">
              <li>Choisis ta production musicale</li>
              <li>Lance ton improvisation vocale</li>
              <li>Les paroles s'affichent seules</li>
              <li>Crée et partage tes créations</li>
            </ul>
          </div>

          {/* Center: Visualizer */}
          <div className="lg:w-1/2 flex flex-col items-center order-1 lg:order-2">
            <div className="w-full aspect-square mb-4 transform -translate-y-4">
              <AudioVisualizer uploadedFile={uploadedFile} />
            </div>
          </div>

          {/* Right side: Lyrics + Buttons */}
          <div className="lg:w-1/4 order-2 lg:order-3 flex flex-col gap-4 items-center h-[calc(100vh-300px)]">
            <div className="bg-slate-900 bg-opacity-80 p-4 rounded-lg border border-sky-900 shadow-md w-full h-full">
              <h2 className="text-2xl font-bold text-sky-500 mb-4">Lyrics</h2>
              <div className="overflow-y-auto h-[calc(100vh-250px)]">
                <p className="text-lg text-sky-400">
                  {isStarted
                    ? "Lyrics will appear here when the visualizer starts..."
                    : "Press start to begin the visualization"}
                </p>
              </div>

              {/* Boutons centrés */}
              <div className="flex justify-center items-center gap-4 mt-4">
                {/* Bouton Upload MP3 */}
                <Button
                  onClick={handleUploadClick}
                  className="flex items-center justify-center gap-2 px-10 py-4 w-44 text-lg bg-sky-500 hover:bg-sky-600 text-black font-bold transition-colors duration-300 ease-in-out transform hover:scale-105"
                >
                  <ArrowUpTrayIcon className="w-5 h-5" />
                  Upload MP3
                </Button>

                {/* Bouton Start/Restart */}
                <Button
                  onClick={() => setIsStarted(true)}
                  className="flex items-center justify-center gap-2 px-10 py-4 w-44 text-lg bg-sky-500 hover:bg-sky-600 text-black font-bold transition-colors duration-300 ease-in-out transform hover:scale-105"
                >
                  {isStarted ? (
                    <>
                      <ArrowPathIcon className="w-5 h-5" />
                      Restart
                    </>
                  ) : (
                    <>
                      <PlayIcon className="w-5 h-5" />
                      Start
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
