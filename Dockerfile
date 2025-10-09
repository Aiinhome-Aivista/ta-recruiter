# Stage 1: Build  
FROM node:20.18.0 as build  
  
USER root
  
# Set working directory  
WORKDIR /app  
  
# Copy all files to the container  
COPY . .   
 
#RUN npm ci --force

#RUN rm -rf node_modules package-lock.json
#RUN npm config set registry https://registry.npmmirror.com/
# Install dependencies  

#RUN npm set registry https://registry.npmmirror.com && \  
    #npm cache clean --force && \  
    #rm -rf node_modules package-lock.json && \
    #npm install -g pnpm

RUN npm install

#RUN npm install -g @angular/cli
#RUN npm install @angular-devkit/build-angular --save-dev

# Build the application  
RUN npm run build:prod

# Stage 2: Production  
FROM nginx

# Copy the build output to the Nginx html directory  
COPY --from=build /app/dist/anurecruiter/browser /usr/share/nginx/html 
  
# Copy custom Nginx configuration file  
COPY nginx.conf /etc/nginx/conf.d/default.conf  
  
# Expose port 80  
EXPOSE 80  
  
# Start Nginx server  
CMD ["nginx", "-g", "daemon off;"]  
