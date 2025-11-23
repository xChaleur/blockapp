pipeline {
    agent any
    
    environment {
        REGISTRY = '192.168.0.101:5000'
        IMAGE_NAME = 'blockapp'
        DOCKER_SERVER = 'op1@192.168.0.101'
        TEST_DIR = '~/blockapp'
        PROD_DIR = '~/blockapp-prod'
    }
    
    stages {
        stage('Checkout') {
            steps {
                echo "🔄 Checking out code from GitHub..."
                checkout scm
                script {
                    env.GIT_COMMIT_SHORT = sh(returnStdout: true, script: "git rev-parse --short HEAD").trim()
                    env.GIT_COMMIT_MSG = sh(returnStdout: true, script: "git log -1 --pretty=%B").trim()
                }
            }
        }
        
        stage('Build Docker Image') {
            steps {
                script {
                    echo "🔨 Building Docker image..."
                    echo "Commit: ${env.GIT_COMMIT_SHORT}"
                    echo "Message: ${env.GIT_COMMIT_MSG}"
                    
                    sh """
                        docker build \
                        -t ${IMAGE_NAME}:${BUILD_NUMBER} \
                        -t ${IMAGE_NAME}:${env.GIT_COMMIT_SHORT} \
                        .
                    """
                    echo "✅ Build complete!"
                }
            }
        }
        
        stage('Push to Registry') {
            steps {
                script {
                    echo "📤 Pushing to Docker Registry..."
                    
                    // Tag with build number and commit hash
                    sh "docker tag ${IMAGE_NAME}:${BUILD_NUMBER} ${REGISTRY}/${IMAGE_NAME}:build-${BUILD_NUMBER}"
                    sh "docker tag ${IMAGE_NAME}:${BUILD_NUMBER} ${REGISTRY}/${IMAGE_NAME}:${env.GIT_COMMIT_SHORT}"
                    sh "docker tag ${IMAGE_NAME}:${BUILD_NUMBER} ${REGISTRY}/${IMAGE_NAME}:latest"
                    
                    // Push build number and commit hash first
                    sh "docker push ${REGISTRY}/${IMAGE_NAME}:build-${BUILD_NUMBER}"
                    sh "docker push ${REGISTRY}/${IMAGE_NAME}:${env.GIT_COMMIT_SHORT}"
                    
                    // Force push latest (this overwrites the old latest tag)
                    sh "docker push ${REGISTRY}/${IMAGE_NAME}:latest"
                    
                    echo "✅ Successfully pushed to registry!"
                    echo "   📦 build-${BUILD_NUMBER} (permanent)"
                    echo "   🔖 ${env.GIT_COMMIT_SHORT} (git commit)"
                    echo "   🆕 latest (updated - replaces old latest)"
                }
            }
        }
        
        stage('Deploy to Test') {
            steps {
                script {
                    echo "🚀 Auto-deploying to TEST environment..."
                    echo "🧹 Forcing fresh image pull..."
                    
                    sh """
                        ssh ${DOCKER_SERVER} '
                            cd ${TEST_DIR} && \
                            echo "Stopping containers..." && \
                            docker-compose down && \
                            echo "Removing ALL cached blockapp images..." && \
                            docker images | grep blockapp | awk "{print \\\$3}" | xargs -r docker rmi -f || true && \
                            echo "Pulling fresh image from registry..." && \
                            docker-compose pull && \
                            echo "Starting with new image..." && \
                            docker-compose up -d && \
                            echo "Verifying deployment..." && \
                            docker ps | grep blockapp && \
                            echo "✅ Test deployment complete!"
                        '
                    """
                    
                    // Get the image ID that's now running
                    def imageId = sh(
                        script: "ssh ${DOCKER_SERVER} 'docker inspect blockapp --format=\"{{.Image}}\"'",
                        returnStdout: true
                    ).trim()
                    
                    echo """
                    ✅ TEST ENVIRONMENT DEPLOYED!
                    
                    🆔 Image ID: ${imageId}
                    
                    🌐 Test URLs:
                       Frontend: http://192.168.0.101:71
                       Backend:  http://192.168.0.101:5001
                    
                    🧪 Please test thoroughly before promoting to production.
                    """
                }
            }
        }
        
        stage('Promote to Production?') {
            steps {
                script {
                    echo "⏸️ Testing complete. Ready to promote to PRODUCTION..."
                    
                    def promoteInput = input(
                        id: 'PromoteToProd',
                        message: 'Promote build #${BUILD_NUMBER} to PRODUCTION?',
                        parameters: [
                            choice(
                                name: 'Action',
                                choices: ['Approve', 'Reject'],
                                description: 'Deploy to production environment'
                            ),
                            text(
                                name: 'Notes',
                                defaultValue: '',
                                description: 'Deployment notes (optional)'
                            )
                        ]
                    )
                    
                    if (promoteInput['Action'] == 'Approve') {
                        echo "✅ Production deployment approved!"
                        if (promoteInput['Notes']) {
                            echo "📝 Notes: ${promoteInput['Notes']}"
                        }
                        env.DEPLOY_TO_PROD = 'true'
                    } else {
                        echo "❌ Production deployment rejected"
                        echo "Build remains in test environment only"
                        env.DEPLOY_TO_PROD = 'false'
                    }
                }
            }
        }
        
        stage('Deploy to Production') {
            when {
                environment name: 'DEPLOY_TO_PROD', value: 'true'
            }
            steps {
                script {
                    echo "🚀 Deploying to PRODUCTION environment..."
                    echo "🧹 Clearing production cache and deploying..."
                    
                    sh """
                        ssh ${DOCKER_SERVER} '
                            cd ${PROD_DIR} && \
                            echo "Stopping production containers..." && \
                            docker-compose down && \
                            echo "Removing ALL cached blockapp images..." && \
                            docker images | grep blockapp | awk "{print \\\$3}" | xargs -r docker rmi -f || true && \
                            echo "Pulling fresh image from registry..." && \
                            docker-compose pull && \
                            echo "Starting production with new image..." && \
                            docker-compose up -d && \
                            echo "Verifying production deployment..." && \
                            docker ps | grep blockapp-prod && \
                            echo "✅ Production deployment complete!"
                        '
                    """
                    
                    // Get the image ID that's now running in production
                    def prodImageId = sh(
                        script: "ssh ${DOCKER_SERVER} 'docker inspect blockapp-prod --format=\"{{.Image}}\"'",
                        returnStdout: true
                    ).trim()
                    
                    echo """
                    ✅ ==========================================
                    ✅ PRODUCTION DEPLOYED SUCCESSFULLY!
                    ✅ ==========================================
                    
                    📦 Build: #${BUILD_NUMBER}
                    🆔 Image ID: ${prodImageId}
                    
                    🌐 Production URLs:
                       Frontend: http://192.168.0.101:73
                       Backend:  http://192.168.0.101:5003
                    
                    🧪 Test URLs (still active):
                       Frontend: http://192.168.0.101:71
                       Backend:  http://192.168.0.101:5001
                    
                    ==========================================
                    """
                }
            }
        }
        
        stage('Cleanup') {
            steps {
                script {
                    echo "🧹 Cleaning up local images..."
                    sh """
                        docker rmi ${IMAGE_NAME}:${BUILD_NUMBER} || true
                        docker rmi ${IMAGE_NAME}:${env.GIT_COMMIT_SHORT} || true
                        docker rmi ${REGISTRY}/${IMAGE_NAME}:build-${BUILD_NUMBER} || true
                        docker rmi ${REGISTRY}/${IMAGE_NAME}:${env.GIT_COMMIT_SHORT} || true
                    """
                }
            }
        }
    }
    
    post {
        success {
            echo """
            ✅ ==========================================
            ✅ PIPELINE COMPLETED SUCCESSFULLY!
            ✅ ==========================================
            
            📦 Image: ${IMAGE_NAME}:${BUILD_NUMBER}
            🔖 Commit: ${env.GIT_COMMIT_SHORT}
            
            🧪 TEST Environment (LIVE):
               http://192.168.0.101:71
               http://192.168.0.101:5001
            
            🌐 Registry UI:
               http://192.168.0.101:8080
            
            ==========================================
            """
        }
        failure {
            echo "❌ Pipeline failed! Check logs above."
        }
        always {
            sh 'docker system prune -f || true'
        }
    }
}