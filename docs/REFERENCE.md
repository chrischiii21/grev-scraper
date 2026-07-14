<section class="relative overflow-hidden" style="font-family: var(--app-sans);">
  <!-- Background -->
  <div class="absolute inset-0 -z-10">
    <img 
         src="" 
         alt="Creative team working"
         class="w-full h-full object-cover"
         />
    <!-- Diagonal Gradient Overlay -->
    <div class="absolute inset-0 bg-gradient-to-tr from-[#0D1445] via-[#0D1445]/85 to-transparent clip-diagonal"></div>
  </div>

  <!-- Content -->
  <div class="relative z-10 flex flex-col justify-center min-h-[650px] px-8 lg:px-20 text-white max-w-3xl">
    <span class="inline-flex items-center gap-2 mb-4 text-sm font-medium text-[#9BB2FF]">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 17L4.75 12L9.75 7M19.25 12H4.75" />
      </svg>
      Experience The Best IT Solutions
    </span>

    <h1 class="text-3xl md:text-5xl font-bold leading-tight mb-5">
      Where Creativity <br /> Meets Cutting-Edge <br /> Technology
    </h1>

    <p class="text-white/80 text-base md:text-lg mb-10 max-w-md">
      Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
    </p>

    <div class="flex flex-wrap items-center gap-4">
      <a href="#" class="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#9BB2FF] hover:bg-[#7F9DFF] text-[#0D1445] font-semibold transition-all duration-300">
        Explore More
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="transition-transform duration-300 group-hover:translate-x-1">
          <path d="M5 12h14M12 5l7 7-7 7"></path>
        </svg>
      </a>

      <a href="#" class="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-white/40 text-white font-semibold hover:bg-white/10 transition-all duration-300">
        View All Services
      </a>
    </div>
  </div>

  <!-- Custom diagonal shape style -->
  <style>
    .clip-diagonal {
      clip-path: polygon(0 0, 70% 0, 50% 100%, 0% 100%);
    }
  </style>
</section>
