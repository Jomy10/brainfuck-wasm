#!/usr/bin/env ruby
require 'beaver'
require 'colorize'

# Usage
# - build_wasm: builds the wasm source files in src/*.wat
# - build_web: builds the website
# - dev: starts the development server for the website

SRC_DIR="src"
BUILD_DIR="out"
WEB_DIR="web"

WEB_WASM_FILES=["main.wasm"]

WASMC="wat2wasm"
NPM="pnpm"

def sgr(s)
  puts s.light_black
  system s
end

command :__default do
  puts "No default command".red
end

command :build_all do
  $beaver.call :build_wasm
  $beaver.call :build_web
end

command :build_wasm, src: "#{SRC_DIR}/*.wat", target_dir: "#{BUILD_DIR}", target_ext: ".wasm" do |src, target|
  system "mkdir -p #{target.dirname}"
  sgr "#{WASMC} #{src} -o #{target}"
end

command :build_web do
  system "mkdir -p #{WEB_DIR}/out"
  WEB_WASM_FILES.each do |file|
    sgr "cp #{BUILD_DIR}/#{SRC_DIR}/#{file} #{WEB_DIR}/out/#{file}"
  end
  sgr "cd #{WEB_DIR} && #{NPM} run build"
end

command :dev do
  puts "#{NPM} run dev".light_black
  exec "cd #{WEB_DIR} && #{NPM} run dev"
end

$beaver.end
